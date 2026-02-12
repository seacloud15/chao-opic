/**
 * ChaoOPIc - Audio Module
 * 오디오 재생 및 녹음 공통 유틸
 */
ChaoOPIc.core.audio = (function() {
  var currentAudio = null;
  var mediaRecorder = null;
  var recordedChunks = [];

  // 공유 MediaStream (recorder + volumeMonitor)
  var sharedMediaStream = null;

  // Volume Monitor 관련 변수
  var audioContext = null;
  var analyser = null;
  var microphone = null;
  var javascriptNode = null;
  var volumeCallback = null;
  var animationId = null;

  /**
   * MediaStream 가져오기 또는 생성 (권한 요청은 한 번만)
   * @returns {Promise<MediaStream>}
   */
  function getOrCreateMediaStream() {
    if (sharedMediaStream) {
      return Promise.resolve(sharedMediaStream);
    }
    return navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function(stream) {
        sharedMediaStream = stream;
        console.log('[Audio] Shared MediaStream created');
        return stream;
      });
  }

  /**
   * 공유 MediaStream 완전 해제 (모든 트랙 정지)
   */
  function releaseMediaStream() {
    if (sharedMediaStream) {
      sharedMediaStream.getTracks().forEach(function(track) {
        track.stop();
      });
      sharedMediaStream = null;
      console.log('[Audio] Shared MediaStream released');
    }
  }

  return {
    play: function(src, onEnded) {
      this.stop();
      currentAudio = new Audio(src);
      currentAudio.onerror = function() {
        console.warn('[Audio] 파일을 찾을 수 없습니다:', src);
        ChaoOPIc.core.ui.showToast('음성 파일을 찾을 수 없습니다.', 'error');
      };
      if (onEnded) {
        currentAudio.onended = onEnded;
      }
      currentAudio.play().catch(function(e) {
        console.warn('[Audio] 재생 실패:', e);
      });
    },

    stop: function() {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
      }
    },

    isPlaying: function() {
      return currentAudio && !currentAudio.paused;
    },

    recorder: {
      isSupported: function() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
      },

      start: function(onReady) {
        if (!this.isSupported()) {
          ChaoOPIc.core.ui.showToast('이 브라우저에서는 녹음이 지원되지 않습니다.', 'error');
          return;
        }
        recordedChunks = [];
        getOrCreateMediaStream()
          .then(function(stream) {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = function(e) {
              if (e.data.size > 0) recordedChunks.push(e.data);
            };
            mediaRecorder.start();
            console.log('[Audio] Recorder started with shared stream');
            if (onReady) onReady();
          })
          .catch(function(e) {
            console.warn('[Audio] 마이크 권한 거부:', e);
            ChaoOPIc.core.ui.showToast('마이크 권한이 필요합니다.', 'error');
          });
      },

      stop: function(onBlob) {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') return;
        mediaRecorder.onstop = function() {
          var blob = new Blob(recordedChunks, { type: 'audio/webm' });
          // 스트림은 공유되므로 여기서 정지하지 않음
          mediaRecorder = null;
          console.log('[Audio] Recorder stopped (stream remains active)');
          if (onBlob) onBlob(blob);
        };
        mediaRecorder.stop();
      },

      isRecording: function() {
        return mediaRecorder && mediaRecorder.state === 'recording';
      }
    },

    /**
     * Volume Monitor (실시간 마이크 음량 감지)
     */
    volumeMonitor: {
      /**
       * 음량 모니터링 시작
       * @param {Function} callback - 음량 값(0-100)을 받는 콜백 함수
       */
      start: function(callback) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.warn('[VolumeMonitor] getUserMedia not supported');
          return;
        }

        volumeCallback = callback;

        getOrCreateMediaStream()
          .then(function(stream) {
            // AudioContext 생성 (브라우저 호환성)
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioContext();

            analyser = audioContext.createAnalyser();
            microphone = audioContext.createMediaStreamSource(stream);

            // ScriptProcessorNode (deprecated but widely supported)
            // 대안: AudioWorklet (최신 브라우저)
            javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 1024;

            microphone.connect(analyser);
            analyser.connect(javascriptNode);
            javascriptNode.connect(audioContext.destination);

            console.log('[VolumeMonitor] Started with shared stream');

            // 실시간 음량 계산
            javascriptNode.onaudioprocess = function() {
              var array = new Uint8Array(analyser.frequencyBinCount);
              analyser.getByteFrequencyData(array);

              // 평균 음량 계산
              var values = 0;
              var length = array.length;
              for (var i = 0; i < length; i++) {
                values += array[i];
              }
              var average = values / length;

              // 0-100 범위로 정규화
              var volume = Math.min(100, Math.round(average * 1.5));

              if (volumeCallback) {
                volumeCallback(volume);
              }
            };
          })
          .catch(function(e) {
            console.warn('[VolumeMonitor] 마이크 권한 거부:', e);
          });
      },

      /**
       * 음량 모니터링 중지
       */
      stop: function() {
        if (javascriptNode) {
          javascriptNode.disconnect();
          javascriptNode.onaudioprocess = null;
          javascriptNode = null;
        }

        if (microphone) {
          microphone.disconnect();
          // 스트림은 공유되므로 여기서 정지하지 않음
          microphone = null;
        }

        if (analyser) {
          analyser.disconnect();
          analyser = null;
        }

        if (audioContext) {
          audioContext.close();
          audioContext = null;
        }

        volumeCallback = null;
        console.log('[VolumeMonitor] Stopped (stream remains active)');
      },

      /**
       * 모니터링 활성 상태 확인
       */
      isActive: function() {
        return !!audioContext && audioContext.state === 'running';
      }
    },

    /**
     * File Saver (녹음 파일 저장)
     */
    fileSaver: {
      /**
       * File System Access API 지원 여부 확인
       */
      isSupported: function() {
        return 'showDirectoryPicker' in window;
      },

      /**
       * 타임스탬프 생성 (YYYYMMDD-HHMMSS)
       */
      getTimestamp: function() {
        var now = new Date();
        var year = now.getFullYear();
        var month = String(now.getMonth() + 1).padStart(2, '0');
        var day = String(now.getDate()).padStart(2, '0');
        var hour = String(now.getHours()).padStart(2, '0');
        var minute = String(now.getMinutes()).padStart(2, '0');
        var second = String(now.getSeconds()).padStart(2, '0');

        return year + month + day + '-' + hour + minute + second;
      },

      /**
       * 파일명 생성
       * @param {number} questionNumber - 문항 번호 (1-15)
       * @param {string} [timestamp] - 타임스탬프 (옵션)
       * @returns {string} - 파일명
       */
      generateFilename: function(questionNumber, timestamp) {
        if (!timestamp) {
          timestamp = this.getTimestamp();
        }
        var num = String(questionNumber).padStart(2, '0');
        return 'recording-q' + num + '-' + timestamp + '.webm';
      },

      /**
       * 폴더에 저장 (File System Access API)
       * @param {Array<Blob>} recordings - 녹음 Blob 배열
       * @param {Function} onProgress - 진행 상태 콜백 (current, total)
       * @param {Function} onComplete - 완료 콜백 (success, message)
       */
      saveToDirectory: function(recordings, onProgress, onComplete) {
        var self = this;

        if (!this.isSupported()) {
          if (onComplete) {
            onComplete(false, '이 브라우저는 폴더 저장을 지원하지 않습니다.');
          }
          return;
        }

        var timestamp = this.getTimestamp();
        var folderName = 'ChaoOPIc-Recordings-' + timestamp;

        // 폴더 선택 다이얼로그
        window.showDirectoryPicker()
          .then(function(directoryHandle) {
            console.log('[FileSaver] Directory selected:', directoryHandle.name);

            // 하위 폴더 생성
            return directoryHandle.getDirectoryHandle(folderName, { create: true })
              .then(function(subDirHandle) {
                console.log('[FileSaver] Subfolder created:', folderName);

                // 순차적으로 파일 저장
                return self._saveRecordingsSequentially(
                  subDirHandle,
                  recordings,
                  0,
                  timestamp,
                  onProgress
                );
              });
          })
          .then(function(savedCount) {
            console.log('[FileSaver] All files saved:', savedCount);
            if (onComplete) {
              onComplete(true, savedCount + '개의 파일이 저장되었습니다.');
            }
          })
          .catch(function(error) {
            console.error('[FileSaver] Save failed:', error);

            var message = '저장 중 오류가 발생했습니다.';
            if (error.name === 'AbortError') {
              message = '저장이 취소되었습니다.';
            }

            if (onComplete) {
              onComplete(false, message);
            }
          });
      },

      /**
       * 순차적으로 파일 저장 (내부 함수)
       * @private
       */
      _saveRecordingsSequentially: function(dirHandle, recordings, index, timestamp, onProgress) {
        var self = this;

        if (index >= recordings.length) {
          return Promise.resolve(recordings.filter(Boolean).length);
        }

        var recording = recordings[index];

        // 녹음하지 않은 문제는 건너뛰기
        if (!recording) {
          if (onProgress) {
            onProgress(index + 1, recordings.length);
          }
          return self._saveRecordingsSequentially(
            dirHandle,
            recordings,
            index + 1,
            timestamp,
            onProgress
          );
        }

        var filename = self.generateFilename(index + 1, timestamp);
        console.log('[FileSaver] Saving file:', filename);

        return dirHandle.getFileHandle(filename, { create: true })
          .then(function(fileHandle) {
            return fileHandle.createWritable();
          })
          .then(function(writable) {
            return writable.write(recording)
              .then(function() {
                return writable.close();
              });
          })
          .then(function() {
            console.log('[FileSaver] File saved:', filename);
            if (onProgress) {
              onProgress(index + 1, recordings.length);
            }

            // 다음 파일 저장
            return self._saveRecordingsSequentially(
              dirHandle,
              recordings,
              index + 1,
              timestamp,
              onProgress
            );
          });
      },

      /**
       * 개별 다운로드 (Fallback)
       * @param {Array<Blob>} recordings - 녹음 Blob 배열
       * @param {Function} onProgress - 진행 상태 콜백 (current, total)
       * @param {Function} onComplete - 완료 콜백 (success, message)
       */
      downloadFiles: function(recordings, onProgress, onComplete) {
        var self = this;
        var timestamp = this.getTimestamp();
        var index = 0;
        var downloadedCount = 0;

        function downloadNext() {
          if (index >= recordings.length) {
            if (onComplete) {
              onComplete(true, downloadedCount + '개의 파일 다운로드 완료');
            }
            return;
          }

          var recording = recordings[index];

          // 녹음하지 않은 문제는 건너뛰기
          if (!recording) {
            index++;
            if (onProgress) {
              onProgress(index, recordings.length);
            }
            downloadNext();
            return;
          }

          var filename = self.generateFilename(index + 1, timestamp);
          var url = URL.createObjectURL(recording);
          var a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();

          console.log('[FileSaver] Downloaded:', filename);
          downloadedCount++;

          setTimeout(function() {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            index++;

            if (onProgress) {
              onProgress(index, recordings.length);
            }

            // 다음 파일 (1초 지연)
            setTimeout(downloadNext, 1000);
          }, 100);
        }

        downloadNext();
      }
    },

    /**
     * 전체 오디오 리소스 정리 (마이크 스트림 완전 해제)
     * 시험 완료 시 또는 페이지 이탈 시 호출
     */
    cleanup: function() {
      // 녹음 중지
      if (this.recorder.isRecording()) {
        this.recorder.stop();
      }

      // 음량 모니터 중지
      if (this.volumeMonitor.isActive()) {
        this.volumeMonitor.stop();
      }

      // 공유 스트림 완전 해제
      releaseMediaStream();

      console.log('[Audio] All resources cleaned up');
    }
  };
})();
