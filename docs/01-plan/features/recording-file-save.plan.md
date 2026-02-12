# 녹음 파일 저장 기능 개발 계획

## 개요
시뮬레이션 시험 완료 후 녹음된 파일들을 로컬 폴더에 저장하는 기능 구현

## 현재 상황

### 녹음 데이터 저장 위치
- **메모리**: `state.recordings` 배열에 Blob 객체로 저장
- **형식**: `audio/webm` (MediaRecorder 기본 포맷)
- **파일명**: 없음 (메모리상 Blob만 존재)

### 제약사항
- **file:// 프로토콜**: 브라우저에서 직접 파일 시스템 쓰기 불가
- **No CDN**: 외부 라이브러리 사용 제한
- **오프라인 실행**: 인터넷 연결 없이 작동 필요

## 구현 방안 비교

### 방안 1: File System Access API (권장)
**장점:**
- 사용자가 선택한 폴더에 직접 저장 가능
- 파일 구조 관리 용이
- 진행 상태 추적 가능

**단점:**
- Chrome 86+, Edge 86+ 이상만 지원
- Firefox, Safari 미지원

**호환성:**
| 브라우저 | 버전 | 지원 여부 |
|---------|------|-----------|
| Chrome | 86+ | ✅ 지원 |
| Edge | 86+ | ✅ 지원 |
| Firefox | - | ❌ 미지원 |
| Safari | - | ❌ 미지원 |

### 방안 2: 개별 다운로드 (Fallback)
**장점:**
- 모든 브라우저 지원
- 구현 간단

**단점:**
- 파일별로 다운로드 팝업 발생
- 사용자 경험 저하
- 브라우저 다운로드 폴더에만 저장

### 방안 3: ZIP 압축 다운로드
**장점:**
- 한 번에 모든 파일 다운로드
- 전송/공유 용이

**단점:**
- JSZip 라이브러리 필요 (외부 CDN 제약)
- 압축 시간 소요

## 채택 방안: 방안 1 + 방안 2 하이브리드

### 구현 전략
```
1. File System Access API 지원 확인
   ├─ 지원됨 → 폴더 선택 후 직접 저장
   └─ 미지원 → 개별 다운로드 방식으로 Fallback
```

## 구현 단계

### 1단계: audio.js에 파일 저장 모듈 추가

#### 1.1 fileSaver 모듈 구조
```javascript
ChaoOPIc.core.audio.fileSaver = {
  // File System Access API 지원 여부 확인
  isSupported: function() {
    return 'showDirectoryPicker' in window;
  },

  // 폴더 선택 및 파일 저장 (File System Access API)
  saveToDirectory: function(recordings, onProgress, onComplete) {
    // 1. 폴더 선택 다이얼로그 표시
    // 2. 각 녹음 파일 저장
    // 3. 진행 상태 콜백 호출
  },

  // 개별 다운로드 (Fallback)
  downloadFiles: function(recordings, onProgress, onComplete) {
    // 1. Blob URL 생성
    // 2. <a> 태그로 다운로드 트리거
    // 3. 순차적으로 다운로드
  },

  // 파일명 생성
  generateFilename: function(questionNumber, date) {
    // 형식: recording-q01-20260211-143021.webm
  }
};
```

#### 1.2 파일명 규칙
```
recording-q{번호}-{YYYYMMDD}-{HHMMSS}.webm

예시:
- recording-q01-20260211-143021.webm
- recording-q02-20260211-143045.webm
- recording-q15-20260211-144530.webm
```

#### 1.3 폴더 구조 (저장 시)
```
📁 선택한 폴더/
└─ 📁 ChaoOPIc-Recordings-20260211-143021/
   ├─ recording-q01-20260211-143021.webm
   ├─ recording-q02-20260211-143045.webm
   ├─ recording-q03-20260211-143112.webm
   ├─ ...
   └─ recording-q15-20260211-144530.webm
```

### 2단계: simulation.js 수정

#### 2.1 renderExamResult 함수에 저장 버튼 추가
```javascript
function renderExamResult() {
  // ... 기존 코드 ...

  // 저장 버튼 섹션
  var saveSection = ui.createElement('div', { className: 'save-section' });

  if (ChaoOPIc.core.audio.fileSaver.isSupported()) {
    // File System Access API 지원
    var saveFolderBtn = ui.createElement('button', {
      className: 'btn btn-primary'
    }, '💾 폴더에 저장');
    saveFolderBtn.addEventListener('click', handleSaveToFolder);
    saveSection.appendChild(saveFolderBtn);
  }

  // Fallback: 개별 다운로드 버튼 (항상 표시)
  var downloadBtn = ui.createElement('button', {
    className: 'btn btn-secondary'
  }, '⬇️ 개별 다운로드');
  downloadBtn.addEventListener('click', handleDownloadFiles);
  saveSection.appendChild(downloadBtn);

  root.appendChild(saveSection);
}
```

#### 2.2 저장 진행 상태 표시
```javascript
function showSaveProgress(current, total) {
  var progressBar = ui.$('#save-progress');
  if (!progressBar) {
    progressBar = ui.createElement('div', {
      id: 'save-progress',
      className: 'save-progress-bar'
    });
    // 진행 바 UI 생성
  }

  var percentage = Math.round((current / total) * 100);
  progressBar.textContent = current + ' / ' + total + ' (' + percentage + '%)';
}
```

### 3단계: CSS 스타일 추가

#### 3.1 저장 버튼 스타일
```css
.save-section {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.save-progress-bar {
  margin-top: 16px;
  padding: 12px;
  background: #e3f2fd;
  border-left: 4px solid #1565c0;
  border-radius: 4px;
  font-weight: 600;
  text-align: center;
}

.save-progress-bar.success {
  background: #e8f5e9;
  border-left-color: #4caf50;
  color: #2e7d32;
}

.save-progress-bar.error {
  background: #ffebee;
  border-left-color: #f44336;
  color: #c62828;
}
```

### 4단계: 상세 구현

#### 4.1 File System Access API 구현
```javascript
saveToDirectory: function(recordings, onProgress, onComplete) {
  var self = this;

  // 폴더 선택
  window.showDirectoryPicker()
    .then(function(directoryHandle) {
      // 타임스탬프로 하위 폴더 생성
      var timestamp = self.getTimestamp();
      var folderName = 'ChaoOPIc-Recordings-' + timestamp;

      return directoryHandle.getDirectoryHandle(folderName, { create: true })
        .then(function(subDirHandle) {
          // 순차적으로 파일 저장
          return self.saveRecordingsSequentially(
            subDirHandle,
            recordings,
            0,
            onProgress
          );
        });
    })
    .then(function() {
      if (onComplete) onComplete(true, '모든 파일이 저장되었습니다.');
    })
    .catch(function(error) {
      console.error('[FileSaver] 저장 실패:', error);
      if (onComplete) onComplete(false, '저장 중 오류가 발생했습니다.');
    });
}
```

#### 4.2 순차적 파일 저장
```javascript
saveRecordingsSequentially: function(dirHandle, recordings, index, onProgress) {
  var self = this;

  if (index >= recordings.length) {
    return Promise.resolve();
  }

  var recording = recordings[index];
  if (!recording) {
    // 녹음하지 않은 문제는 건너뛰기
    return self.saveRecordingsSequentially(dirHandle, recordings, index + 1, onProgress);
  }

  var filename = self.generateFilename(index + 1);

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
      if (onProgress) onProgress(index + 1, recordings.length);
      // 다음 파일 저장
      return self.saveRecordingsSequentially(dirHandle, recordings, index + 1, onProgress);
    });
}
```

#### 4.3 개별 다운로드 (Fallback)
```javascript
downloadFiles: function(recordings, onProgress, onComplete) {
  var self = this;
  var index = 0;

  function downloadNext() {
    if (index >= recordings.length) {
      if (onComplete) onComplete(true, '모든 파일 다운로드 완료');
      return;
    }

    var recording = recordings[index];
    if (!recording) {
      index++;
      downloadNext();
      return;
    }

    var filename = self.generateFilename(index + 1);
    var url = URL.createObjectURL(recording);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    setTimeout(function() {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      index++;
      if (onProgress) onProgress(index, recordings.length);

      // 다음 파일 (1초 지연)
      setTimeout(downloadNext, 1000);
    }, 100);
  }

  downloadNext();
}
```

#### 4.4 타임스탬프 생성
```javascript
getTimestamp: function() {
  var now = new Date();
  var year = now.getFullYear();
  var month = String(now.getMonth() + 1).padStart(2, '0');
  var day = String(now.getDate()).padStart(2, '0');
  var hour = String(now.getHours()).padStart(2, '0');
  var minute = String(now.getMinutes()).padStart(2, '0');
  var second = String(now.getSeconds()).padStart(2, '0');

  return year + month + day + '-' + hour + minute + second;
}
```

### 5단계: 사용자 경험 개선

#### 5.1 저장 전 확인 메시지
```javascript
function handleSaveToFolder() {
  var recordedCount = state.recordings.filter(Boolean).length;

  var message = recordedCount + '개의 녹음 파일을 저장하시겠습니까?';

  ChaoOPIc.core.ui.showModal({
    title: '녹음 파일 저장',
    content: '<p>' + message + '</p><p style="color:#666;font-size:0.9rem;">폴더를 선택하면 하위 폴더가 자동 생성됩니다.</p>',
    buttons: [
      {
        label: '취소',
        className: 'btn-secondary',
        onClick: function() { /* 취소 */ }
      },
      {
        label: '저장',
        className: 'btn-primary',
        onClick: function() {
          startSaveProcess();
        }
      }
    ]
  });
}
```

#### 5.2 저장 완료 알림
```javascript
function onSaveComplete(success, message) {
  if (success) {
    ChaoOPIc.core.ui.showToast('✅ ' + message, 'success');
  } else {
    ChaoOPIc.core.ui.showToast('❌ ' + message, 'error');
  }
}
```

## UI 목업

### 시험 완료 화면
```
┌─────────────────────────────────────────┐
│  시험 완료                              │
│                                         │
│  총 문항: 15    녹음 완료: 13          │
│  자가 평가 레벨: 4                      │
│                                         │
│  ┌───────────────────────────────┐     │
│  │ 💾 폴더에 저장  ⬇️ 개별 다운로드 │     │
│  └───────────────────────────────┘     │
│                                         │
│  [진행 상태: 5 / 13 (38%)]             │
│                                         │
│  문항 1  [▶ 내 답변 듣기]               │
│  문항 2  [▶ 내 답변 듣기]               │
│  ...                                    │
└─────────────────────────────────────────┘
```

## 테스트 시나리오

### 시나리오 1: File System Access API 지원 브라우저
1. 시험 완료 후 결과 화면으로 이동
2. "💾 폴더에 저장" 버튼 클릭
3. 폴더 선택 다이얼로그에서 저장 위치 선택
4. 진행 상태 표시 (1/13, 2/13, ...)
5. 완료 메시지: "✅ 모든 파일이 저장되었습니다."
6. 선택한 폴더 열어서 파일 확인

### 시나리오 2: File System Access API 미지원 브라우저
1. 시험 완료 후 결과 화면으로 이동
2. "💾 폴더에 저장" 버튼 없음 (미지원)
3. "⬇️ 개별 다운로드" 버튼만 표시
4. 버튼 클릭 시 파일이 순차적으로 다운로드됨
5. 브라우저 기본 다운로드 폴더에 파일 저장 확인

### 시나리오 3: 일부 문항만 녹음한 경우
1. 15문항 중 10문항만 녹음
2. 저장 시 녹음된 10개 파일만 저장
3. 녹음하지 않은 문항은 자동 건너뛰기
4. 파일명 번호는 문항 번호와 일치

## 예상 이슈 및 해결

### 이슈 1: 브라우저 보안 정책
**문제**: File System Access API는 사용자 제스처 필요
**해결**: 버튼 클릭 이벤트에서만 호출

### 이슈 2: 대용량 파일 저장 시간
**문제**: 15개 파일 저장 시 시간 소요
**해결**: 진행 상태 표시로 사용자에게 피드백

### 이슈 3: 파일명 중복
**문제**: 같은 폴더에 여러 번 저장 시 중복
**해결**: 타임스탬프 기반 하위 폴더 자동 생성

## 파일 체크리스트
- [ ] `js/core/audio.js` 수정 (fileSaver 모듈 추가)
- [ ] `js/pages/simulation.js` 수정 (renderExamResult 함수)
- [ ] `css/style.css` 수정 (저장 버튼 스타일)
- [ ] `test-file-save.html` 생성 (테스트 페이지)

## 예상 작업 시간
- audio.js 구현: 2시간
- simulation.js 통합: 1시간
- CSS 스타일링: 30분
- 테스트 및 디버깅: 1.5시간
- **총 예상: 5시간**

## 참고 자료
- [File System Access API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
- [showDirectoryPicker() - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker)
- [Can I use: File System Access API](https://caniuse.com/native-filesystem-api)
