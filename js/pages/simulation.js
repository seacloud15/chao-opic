/**
 * ChaoOPIc - Simulation Page Logic
 * 실제 OPIc 시험 환경 시뮬레이션 (5단계)
 * Step 1: Background Survey → Step 2: Self Assessment → Step 3: Setup
 * → Step 4: Sample Question → Step 5: Begin Test
 */
ChaoOPIc.pages.simulation = (function() {
  var ui = ChaoOPIc.core.ui;
  var audio = ChaoOPIc.core.audio;
  var timer = ChaoOPIc.core.timer;
  var sim = ChaoOPIc.data.simulation;

  var STORAGE_KEY = 'chaoopic_survey';

  function saveSurvey() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        surveyAnswers: state.surveyAnswers,
        selfAssessLevel: state.selfAssessLevel
      }));
    } catch (e) { /* quota exceeded 등 무시 */ }
  }

  function loadSurvey() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved.surveyAnswers) state.surveyAnswers = saved.surveyAnswers;
      if (saved.selfAssessLevel) state.selfAssessLevel = saved.selfAssessLevel;
    } catch (e) { /* 파싱 실패 무시 */ }
  }

  var STEPS = [
    { id: 'survey', num: 1, label: 'Background Survey' },
    { id: 'selfAssess', num: 2, label: 'Self Assessment' },
    { id: 'setup', num: 3, label: 'Setup' },
    { id: 'sample', num: 4, label: 'Sample Question' },
    { id: 'exam', num: 5, label: 'Begin Test' }
  ];

  var state = {
    step: 'intro',
    surveyPart: 1,
    surveyAnswers: {},
    selfAssessLevel: null,
    examPhase: 'guide',
    questions: [],
    currentIndex: 0,
    recordings: [],
    examTimer: null,
    setupRecording: null,
    replayUsed: {},
    replayTimer: null,
    playCount: {}, // 각 문제별 재생 횟수 추적
    autoRecordingStarted: {}, // 자동 녹음 시작 여부
    // Sample Question 전용 상태
    samplePlayCount: 0,
    sampleReplayUsed: null,
    sampleAutoRecordingStarted: false,
    sampleRecording: null
  };

  // === Step Bar ===
  function renderStepBar(root, activeStepId) {
    var bar = ui.createElement('div', { className: 'opic-step-bar' });
    var activeIdx = -1;
    STEPS.forEach(function(s, i) {
      if (s.id === activeStepId) activeIdx = i;
    });

    STEPS.forEach(function(s, i) {
      var cls = 'opic-step-item';
      if (i < activeIdx) cls += ' completed';
      else if (i === activeIdx) cls += ' active';

      var item = ui.createElement('div', { className: cls });
      var numText = 'Step ' + s.num;
      if (i < activeIdx) numText = 'Step ' + s.num + ' ';

      var numSpan = ui.createElement('span', { className: 'opic-step-num' });
      numSpan.textContent = numText;
      if (i < activeIdx) {
        var check = ui.createElement('span', { className: 'opic-step-check' }, '\u2713');
        numSpan.appendChild(check);
      }
      item.appendChild(numSpan);
      item.appendChild(ui.createElement('span', { className: 'opic-step-label' }, s.label));
      bar.appendChild(item);
    });
    root.appendChild(bar);
  }

  // === Volume Meter ===
  function createVolumeMeter() {
    var container = ui.createElement('div', { className: 'opic-volume-meter-container inactive' });

    var label = ui.createElement('div', { className: 'opic-volume-meter-label' }, '🎤 음량');
    container.appendChild(label);

    var meter = ui.createElement('div', { className: 'opic-volume-meter' });

    // 20개의 바 생성
    var bars = [];
    for (var i = 0; i < 20; i++) {
      var bar = ui.createElement('div', { className: 'opic-volume-bar' });
      bars.push(bar);
      meter.appendChild(bar);
    }

    var valueDisplay = ui.createElement('div', { className: 'opic-volume-value' }, '0');
    meter.appendChild(valueDisplay);

    container.appendChild(meter);

    // 볼륨 업데이트 함수
    container.updateVolume = function(volume) {
      // 0-100 범위의 volume 값
      valueDisplay.textContent = volume;

      // 활성화된 바 개수 계산 (0-20)
      var activeCount = Math.round((volume / 100) * 20);

      bars.forEach(function(bar, index) {
        if (index < activeCount) {
          bar.className = 'opic-volume-bar active';

          // 색상 구분 (0-60: 초록, 60-80: 노랑, 80-100: 빨강)
          if (volume > 80) {
            bar.className += ' high';
          } else if (volume > 60) {
            bar.className += ' mid';
          }
        } else {
          bar.className = 'opic-volume-bar';
        }
      });
    };

    // 볼륨 모니터 시작
    container.startMonitoring = function() {
      container.classList.remove('inactive');
      audio.volumeMonitor.start(function(volume) {
        container.updateVolume(volume);
      });
    };

    // 볼륨 모니터 중지
    container.stopMonitoring = function() {
      container.classList.add('inactive');
      audio.volumeMonitor.stop();
      container.updateVolume(0);
    };

    return container;
  }

  // === Navigation Buttons ===
  function renderNav(root, onBack, onNext, nextLabel, nextDisabled) {
    var nav = ui.createElement('div', { className: 'opic-nav' });
    if (onBack) {
      var backBtn = ui.createElement('button', { className: 'opic-btn-back' }, '\u2039 Back');
      backBtn.addEventListener('click', onBack);
      nav.appendChild(backBtn);
    } else {
      nav.appendChild(ui.createElement('div'));
    }
    if (onNext) {
      var nextBtn = ui.createElement('button', { className: 'opic-btn-next' }, (nextLabel || 'Next') + ' \u203A');
      if (nextDisabled) nextBtn.disabled = true;
      nextBtn.addEventListener('click', onNext);
      nav.appendChild(nextBtn);
    }
    root.appendChild(nav);
  }

  // === Intro Screen ===
  function renderIntro() {
    state.step = 'intro';
    var root = ui.$('#sim-root');
    root.innerHTML = '';

    var wrap = ui.createElement('div', { className: 'opic-intro' });
    wrap.appendChild(ui.createElement('div', { className: 'opic-intro-title' }, '\uD83D\uDD0A ' + sim.intro.title));
    wrap.appendChild(ui.createElement('p', { className: 'opic-intro-subtitle' }, sim.intro.subtitle));
    wrap.appendChild(ui.createElement('img', {
      className: 'opic-intro-interviewer',
      src: 'images/interviewer-mai.png',
      alt: sim.intro.interviewer
    }));
    wrap.appendChild(ui.createElement('p', { className: 'opic-intro-subtitle' },
      '\uBCF8 \uC778\uD130\uBDF0 \uD3C9\uAC00\uC758 \uC9C4\uD589\uC790\uB294 ' + sim.intro.interviewer + ' \uC785\uB2C8\uB2E4.'));

    var nextBtn = ui.createElement('button', { className: 'opic-btn-next' }, 'Next \u203A');
    nextBtn.addEventListener('click', function() { renderSurvey(); });
    wrap.appendChild(nextBtn);

    root.appendChild(wrap);
  }

  // === Step 1: Background Survey ===
  function renderSurvey() {
    state.step = 'survey';
    var root = ui.$('#sim-root');
    root.innerHTML = '';
    renderStepBar(root, 'survey');

    var partData = sim.backgroundSurvey[state.surveyPart - 1];
    if (!partData) return;

    root.appendChild(ui.createElement('h2', { className: 'opic-survey-header' }, 'Background Survey'));
    root.appendChild(ui.createElement('p', { className: 'opic-survey-instruction' },
      '\uC9C8\uBB38\uC744 \uC77D\uACE0 \uC815\uD655\uD788 \uB2F5\uBCC0\uD574 \uC8FC\uC2DC\uAE30 \uBC14\uB78D\uB2C8\uB2E4. \uC124\uBB38\uC5D0 \uB300\uD55C \uC751\uB2F5\uC744 \uAE30\uCD08\uB85C \uAC1C\uC778\uBCC4 \uBB38\uD56D\uC774 \uCD9C\uC81C\uB429\uB2C8\uB2E4.'));
    root.appendChild(ui.createElement('div', { className: 'opic-survey-part' }, 'Part ' + state.surveyPart + ' of 4'));

    if (partData.type === 'radio') {
      renderSurveyRadio(root, partData);
    } else if (partData.type === 'conditional') {
      renderSurveyConditional(root, partData);
    } else if (partData.type === 'multi-checkbox') {
      renderSurveyMultiCheckbox(root, partData);
    }

    renderNav(root,
      state.surveyPart > 1 ? function() { state.surveyPart--; renderSurvey(); } : function() { renderIntro(); },
      function() { if (validateSurveyPart()) { saveSurvey(); nextFromSurvey(); } },
      'Next'
    );
  }

  function renderSurveyRadio(root, partData) {
    root.appendChild(ui.createElement('h3', { className: 'opic-survey-question' }, partData.question));
    var group = ui.createElement('div', { className: 'radio-group' });
    var key = 'part' + partData.part;
    partData.options.forEach(function(opt) {
      var label = ui.createElement('label');
      var input = ui.createElement('input', { type: 'radio', name: 'survey-' + key, value: opt });
      if (state.surveyAnswers[key] === opt) input.checked = true;
      input.addEventListener('change', function() { state.surveyAnswers[key] = opt; });
      label.appendChild(input);
      label.appendChild(document.createTextNode(opt));
      group.appendChild(label);
    });
    root.appendChild(group);
  }

  function renderSurveyConditional(root, partData) {
    var key = 'part' + partData.part;
    var subKey = 'part' + partData.part + '_sub';

    root.appendChild(ui.createElement('h3', { className: 'opic-survey-question' }, partData.question));
    var mainGroup = ui.createElement('div', { className: 'radio-group' });
    partData.options.forEach(function(opt) {
      var label = ui.createElement('label');
      var input = ui.createElement('input', { type: 'radio', name: 'survey-' + key, value: opt });
      if (state.surveyAnswers[key] === opt) input.checked = true;
      input.addEventListener('change', function() {
        state.surveyAnswers[key] = opt;
        delete state.surveyAnswers[subKey];
        renderSurvey();
      });
      label.appendChild(input);
      label.appendChild(document.createTextNode(opt));
      mainGroup.appendChild(label);
    });
    root.appendChild(mainGroup);

    var mainAnswer = state.surveyAnswers[key];
    if (mainAnswer && partData.subQuestions[mainAnswer]) {
      var sub = partData.subQuestions[mainAnswer];
      var subSection = ui.createElement('div', { style: 'margin-top:24px;' });
      subSection.appendChild(ui.createElement('h3', { className: 'opic-survey-question' }, sub.question));
      var subGroup = ui.createElement('div', { className: 'radio-group' });
      sub.options.forEach(function(opt) {
        var label = ui.createElement('label');
        var input = ui.createElement('input', { type: 'radio', name: 'survey-' + subKey, value: opt });
        if (state.surveyAnswers[subKey] === opt) input.checked = true;
        input.addEventListener('change', function() { state.surveyAnswers[subKey] = opt; });
        label.appendChild(input);
        label.appendChild(document.createTextNode(opt));
        subGroup.appendChild(label);
      });
      subSection.appendChild(subGroup);
      root.appendChild(subSection);
    }
  }

  function renderSurveyMultiCheckbox(root, partData) {
    var key = 'part4';
    if (!state.surveyAnswers[key]) state.surveyAnswers[key] = [];

    // 현재 옵션 목록에 없는 저장값 제거
    var allOptions = [];
    partData.groups.forEach(function(grp) {
      grp.options.forEach(function(opt) { allOptions.push(opt); });
    });
    state.surveyAnswers[key] = state.surveyAnswers[key].filter(function(v) {
      return allOptions.indexOf(v) !== -1;
    });

    // Instruction
    var instrDiv = ui.createElement('div', { style: 'margin-bottom:16px;' });
    instrDiv.innerHTML = partData.instruction;
    root.appendChild(instrDiv);

    // Sticky counter (root 직접 자식으로 배치)
    var count = state.surveyAnswers[key].length;
    var counterCls = 'opic-counter' + (count < partData.minTotal ? ' insufficient' : '');
    root.appendChild(ui.createElement('div', { className: counterCls },
      count + ' \uAC1C \uD56D\uBAA9\uC744 \uC120\uD0DD\uD588\uC2B5\uB2C8\uB2E4.'));

    partData.groups.forEach(function(grp) {
      root.appendChild(ui.createElement('h3', { className: 'opic-survey-question', style: 'margin-top:20px;' }, grp.question));
      var group = ui.createElement('div', { className: 'checkbox-group' });
      grp.options.forEach(function(opt) {
        var label = ui.createElement('label');
        var input = ui.createElement('input', { type: 'checkbox', value: opt });
        if (state.surveyAnswers[key].indexOf(opt) !== -1) input.checked = true;
        input.addEventListener('change', function() {
          var arr = state.surveyAnswers[key];
          if (this.checked) {
            if (arr.indexOf(opt) === -1) arr.push(opt);
          } else {
            var idx = arr.indexOf(opt);
            if (idx !== -1) arr.splice(idx, 1);
          }
          // Update counter
          var counterEl = ui.$('.opic-counter');
          if (counterEl) {
            counterEl.textContent = arr.length + ' \uAC1C \uD56D\uBAA9\uC744 \uC120\uD0DD\uD588\uC2B5\uB2C8\uB2E4.';
            counterEl.className = 'opic-counter' + (arr.length < partData.minTotal ? ' insufficient' : '');
          }
        });
        label.appendChild(input);
        label.appendChild(document.createTextNode(opt));
        group.appendChild(label);
      });
      root.appendChild(group);
    });
  }

  function validateSurveyPart() {
    var partData = sim.backgroundSurvey[state.surveyPart - 1];
    if (partData.type === 'radio') {
      if (!state.surveyAnswers['part' + partData.part]) {
        ui.showToast('\uD56D\uBAA9\uC744 \uC120\uD0DD\uD574\uC8FC\uC138\uC694.', 'error');
        return false;
      }
    } else if (partData.type === 'conditional') {
      if (!state.surveyAnswers['part' + partData.part]) {
        ui.showToast('\uD56D\uBAA9\uC744 \uC120\uD0DD\uD574\uC8FC\uC138\uC694.', 'error');
        return false;
      }
      if (!state.surveyAnswers['part' + partData.part + '_sub']) {
        ui.showToast('\uD558\uC704 \uC9C8\uBB38\uC5D0\uB3C4 \uB2F5\uBCC0\uD574\uC8FC\uC138\uC694.', 'error');
        return false;
      }
    } else if (partData.type === 'multi-checkbox') {
      var selected = state.surveyAnswers['part4'] || [];
      if (selected.length < partData.minTotal) {
        ui.showToast(partData.minTotal + '\uAC1C \uC774\uC0C1\uC758 \uD56D\uBAA9\uC744 \uC120\uD0DD\uD574\uC8FC\uC138\uC694. (\uD604\uC7AC ' + selected.length + '\uAC1C)', 'error');
        return false;
      }
    }
    return true;
  }

  function nextFromSurvey() {
    if (state.surveyPart < 4) {
      state.surveyPart++;
      renderSurvey();
    } else {
      renderSelfAssessment();
    }
  }

  // === Step 2: Self Assessment ===
  function renderSelfAssessment() {
    state.step = 'selfAssess';
    var root = ui.$('#sim-root');
    root.innerHTML = '';
    renderStepBar(root, 'selfAssess');

    root.appendChild(ui.createElement('h2', { className: 'opic-survey-header' }, 'Self Assessment'));
    var instrDiv = ui.createElement('p', { className: 'opic-survey-instruction' });
    instrDiv.innerHTML = '\uBCF8 Self Assessment\uC5D0 \uB300\uD55C \uC751\uB2F5\uC744 \uAE30\uCD08\uB85C \uAC1C\uC778\uBCC4 \uBB38\uD56D\uC774 \uCD9C\uC81C\uB429\uB2C8\uB2E4. \uC124\uBA85\uC744 \uC798 \uC77D\uACE0 \uBCF8\uC778\uC758 Vietnamese \uB9D0\uD558\uAE30 \uB2A5\uB825\uACFC \uBE44\uC2B7\uD55C \uC218\uC900\uC744 \uC120\uD0DD\uD558\uC2DC\uAE30 \uBC14\uB78D\uB2C8\uB2E4.';
    root.appendChild(instrDiv);

    var levels = ui.createElement('div', { className: 'opic-levels' });
    sim.selfAssessment.forEach(function(lvl) {
      var row = ui.createElement('div', { className: 'opic-level' });
      row.addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON') return;
        var radio = row.querySelector('input[type="radio"]');
        if (radio) { radio.checked = true; state.selfAssessLevel = lvl.level; }
      });

      var numDiv = ui.createElement('div', { className: 'opic-level-num l' + lvl.level }, String(lvl.level));
      row.appendChild(numDiv);

      var radio = ui.createElement('input', { type: 'radio', name: 'self-assess', value: String(lvl.level) });
      if (state.selfAssessLevel === lvl.level) radio.checked = true;
      radio.addEventListener('change', function() { state.selfAssessLevel = lvl.level; });
      row.appendChild(radio);

      var audioBtn = ui.createElement('button', {
        className: 'opic-level-audio l' + lvl.level
      }, '\uD83D\uDD0A Sample Audio');
      audioBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        var audioPath = 'audio/selfAssessment/' + lvl.level + '.mp3';
        audio.play(audioPath);
        ui.showToast('\uB808\uBCA8 ' + lvl.level + ' \uC0D8\uD50C \uC624\uB514\uC624 \uC7AC\uC0DD \uC911', 'info');
      });
      row.appendChild(audioBtn);

      row.appendChild(ui.createElement('div', { className: 'opic-level-desc' }, lvl.description));
      levels.appendChild(row);
    });
    root.appendChild(levels);

    renderNav(root,
      function() { state.surveyPart = 4; renderSurvey(); },
      function() {
        if (!state.selfAssessLevel) {
          ui.showToast('\uB808\uBCA8\uC744 \uC120\uD0DD\uD574\uC8FC\uC138\uC694.', 'error');
          return;
        }
        saveSurvey();
        renderSetup();
      },
      'Next'
    );
  }

  // === Step 3: Setup ===
  function renderSetup() {
    state.step = 'setup';
    var root = ui.$('#sim-root');
    root.innerHTML = '';
    renderStepBar(root, 'setup');

    root.appendChild(ui.createElement('h2', { className: 'opic-survey-header' }, 'Pre-Test Setup'));
    root.appendChild(ui.createElement('hr', { style: 'border:none;border-top:2px solid #e65100;margin-bottom:24px;' }));

    var layout = ui.createElement('div', { className: 'opic-exam-layout' });

    // Left: interviewer
    var left = ui.createElement('div', { className: 'opic-exam-left' });
    var interviewerWrap = ui.createElement('div', { className: 'opic-interviewer-wrap' });
    interviewerWrap.appendChild(ui.createElement('img', { src: 'images/interviewer-mai.png', alt: 'Interviewer' }));

    var playBar = ui.createElement('div', { className: 'opic-play-bar' });
    var playBtn = ui.createElement('button', { className: 'opic-play-btn' }, '\u25B6');
    playBtn.addEventListener('click', function() {
      audio.play('audio/simulation/sampleQuestion/pre-test.mp3');
    });
    playBar.appendChild(playBtn);
    playBar.appendChild(ui.createElement('div', { className: 'opic-progress-track' }));
    interviewerWrap.appendChild(playBar);
    left.appendChild(interviewerWrap);
    layout.appendChild(left);

    // Right: instructions + recording controls
    var right = ui.createElement('div', { className: 'opic-exam-right' });
    var instrList = ui.createElement('ol', { className: 'opic-setup-instructions' });
    sim.setup.instructions.forEach(function(text) {
      var li = ui.createElement('li');
      li.innerHTML = text;
      instrList.appendChild(li);
    });
    right.appendChild(instrList);

    // Recording controls
    var recControls = ui.createElement('div', { className: 'opic-rec-controls' });

    var startBtn = ui.createElement('button', { className: 'opic-rec-btn start' }, '\uD83C\uDFA4 Start Recording');
    var stopBtn = ui.createElement('button', { className: 'opic-rec-btn stop', style: 'display:none;' }, '\u23F9 Stop Recording');
    var playRecBtn = ui.createElement('button', { className: 'opic-rec-btn play', style: 'display:none;' }, '\u25B6 Play Recording');

    startBtn.addEventListener('click', function() {
      audio.recorder.start(function() {
        // 녹음 시작 후 음량 미터 시작 (공유 스트림 사용)
        volumeMeter.startMonitoring();

        startBtn.style.display = 'none';
        stopBtn.style.display = '';
        playRecBtn.style.display = 'none';
      });
    });

    stopBtn.addEventListener('click', function() {
      // 음량 미터 중지
      volumeMeter.stopMonitoring();

      audio.recorder.stop(function(blob) {
        state.setupRecording = blob;
        stopBtn.style.display = 'none';
        startBtn.style.display = '';
        playRecBtn.style.display = '';
        ui.showToast('\uB179\uC74C \uC644\uB8CC', 'success');
      });
    });

    playRecBtn.addEventListener('click', function() {
      if (state.setupRecording) {
        var url = URL.createObjectURL(state.setupRecording);
        var a = new Audio(url);
        a.play();
        a.onended = function() { URL.revokeObjectURL(url); };
      }
    });

    recControls.appendChild(startBtn);
    recControls.appendChild(stopBtn);
    recControls.appendChild(playRecBtn);
    right.appendChild(recControls);

    // Volume Meter
    var volumeMeter = createVolumeMeter();
    right.appendChild(volumeMeter);

    layout.appendChild(right);
    root.appendChild(layout);

    renderNav(root,
      function() { renderSelfAssessment(); },
      function() { renderSample(); },
      'Next'
    );
  }

  // === Step 4: Sample Question ===
  function renderSample() {
    state.step = 'sample';
    var root = ui.$('#sim-root');
    root.innerHTML = '';
    renderStepBar(root, 'sample');

    root.appendChild(ui.createElement('h2', { className: 'opic-survey-header' }, 'Sample Question'));
    root.appendChild(ui.createElement('p', { style: 'color:#666;margin-bottom:16px;' }, sim.sampleQuestion.notice));
    root.appendChild(ui.createElement('h3', { style: 'margin-bottom:20px;' }, 'Question 1 of 1'));

    var layout = ui.createElement('div', { className: 'opic-exam-layout' });

    // Left: interviewer + play
    var left = ui.createElement('div', { className: 'opic-exam-left' });
    var interviewerWrap = ui.createElement('div', { className: 'opic-interviewer-wrap' });
    interviewerWrap.appendChild(ui.createElement('img', { src: 'images/interviewer-mai.png', alt: 'Interviewer' }));

    var playBar = ui.createElement('div', { className: 'opic-play-bar' });
    var playBtn = ui.createElement('button', { id: 'sample-play-btn', className: 'opic-play-btn' }, '\u25B6');
    playBtn.addEventListener('click', function() {
      if (!state.sampleReplayUsed) {
        // 첫 재생
        state.samplePlayCount++;
        audio.play(sim.sampleQuestion.audio, function() {
          // 재생 완료 후 자동 녹음 시작
          console.log('[Sample] Auto-starting recording after 1st play');
          startSampleAutoRecording();
          enableSampleReplayWindow();
        });
        state.sampleReplayUsed = 'played';
      } else if (state.sampleReplayUsed === 'replay-ready') {
        // 두 번째 재생 (5초 이내)
        // 진행 중인 녹음 중지 및 삭제
        if (audio.recorder.isRecording()) {
          audio.recorder.stop(function() {
            console.log('[Sample] Previous recording discarded');
          });
        }
        var volumeMeter = ui.$('.opic-volume-meter-container');
        if (volumeMeter && volumeMeter.stopMonitoring) {
          volumeMeter.stopMonitoring();
        }

        // 녹음 데이터 및 상태 초기화
        state.sampleRecording = null;
        state.sampleAutoRecordingStarted = false;

        state.samplePlayCount++;
        audio.play(sim.sampleQuestion.audio, function() {
          // 재생 완료 후 자동 녹음 시작
          console.log('[Sample] Auto-starting recording after 2nd play');
          startSampleAutoRecording();
        });
        state.sampleReplayUsed = 'replay-done';
        playBtn.disabled = true;
        playBtn.style.opacity = '0.5';
      }
    });
    playBar.appendChild(playBtn);
    playBar.appendChild(ui.createElement('div', { className: 'opic-progress-track' }));
    interviewerWrap.appendChild(playBar);
    interviewerWrap.appendChild(ui.createElement('div', { className: 'opic-play-label' }, "Click 'PLAY' button to Listen"));
    left.appendChild(interviewerWrap);
    layout.appendChild(left);

    // Right: question grid + info + controls
    var right = ui.createElement('div', { className: 'opic-exam-right' });

    // Question grid (just 1)
    right.appendChild(ui.createElement('div', { className: 'opic-q-grid-label' }, '\uBB38\uD56D \uC9C4\uD589:'));
    var grid = ui.createElement('div', { className: 'opic-q-grid' });
    grid.appendChild(ui.createElement('div', { className: 'opic-q-num current' }, '1'));
    right.appendChild(grid);

    // Info box
    var infoBox = ui.createElement('div', { className: 'opic-info-box' });
    infoBox.innerHTML = sim.sampleQuestion.replayNotice.replace('\n', '<br>');
    right.appendChild(infoBox);

    // Volume Meter
    var volumeMeter = createVolumeMeter();
    right.appendChild(volumeMeter);

    layout.appendChild(right);
    root.appendChild(layout);

    // Play 버튼 초기 상태 설정
    if (state.sampleReplayUsed === 'replay-done' || state.sampleReplayUsed === 'played') {
      if (state.sampleReplayUsed !== 'replay-ready') {
        playBtn.disabled = true;
        playBtn.style.opacity = '0.5';
      }
    }

    renderNav(root,
      function() { renderSetup(); },
      function() {
        // Next 버튼: 녹음 중지
        audio.stop();
        volumeMeter.stopMonitoring();
        if (audio.recorder.isRecording()) {
          audio.recorder.stop(function(blob) {
            state.sampleRecording = blob;
            console.log('[Sample] Recording saved');
            renderExamGuide();
          });
        } else {
          renderExamGuide();
        }
      },
      'Next'
    );
  }

  // Sample Question 자동 녹음 시작
  function startSampleAutoRecording() {
    if (state.sampleAutoRecordingStarted) return;
    state.sampleAutoRecordingStarted = true;

    var volumeMeter = ui.$('.opic-volume-meter-container');

    // 녹음 시작
    audio.recorder.start(function() {
      console.log('[Sample] Auto-recording started');

      // 음량 미터 시작
      if (volumeMeter && volumeMeter.startMonitoring) {
        volumeMeter.startMonitoring();
      }

      ui.showToast('녹음이 자동으로 시작되었습니다.', 'info');
    });
  }

  // Sample Question 5초 재생 윈도우
  function enableSampleReplayWindow() {
    // 5초 윈도우 시작
    if (state.replayTimer) clearTimeout(state.replayTimer);
    state.sampleReplayUsed = 'replay-ready';
    var playBtn = ui.$('#sample-play-btn');
    if (playBtn) {
      playBtn.disabled = false;
      playBtn.style.opacity = '1';
    }
    state.replayTimer = setTimeout(function() {
      // 5초 내에 재생하지 않았으면 재생 윈도우 종료
      if (state.sampleReplayUsed === 'replay-ready') {
        state.sampleReplayUsed = 'replay-done';
        var btn = ui.$('#sample-play-btn');
        if (btn) {
          btn.disabled = true;
          btn.style.opacity = '0.5';
        }
      }
    }, 5000);
  }

  // === Step 5: Begin Test - Guide ===
  function renderExamGuide() {
    state.step = 'exam';
    state.examPhase = 'guide';
    var root = ui.$('#sim-root');
    root.innerHTML = '';
    renderStepBar(root, 'exam');

    root.appendChild(ui.createElement('h2', { className: 'opic-rules-title' }, '\uC2DC\uD5D8 \uC9C4\uD589 \uC548\uB0B4'));
    root.appendChild(ui.createElement('p', { className: 'opic-rules-subtitle' }, '\uC720\uC758\uC0AC\uD56D\uC744 \uC77D\uACE0 \uAC01 \uCCB4\uD06C\uBC15\uC2A4\uB97C \uC120\uD0DD\uD558\uC5EC \uC8FC\uC2ED\uC2DC\uC624.'));

    var ICONS = {
      window: '\uD83D\uDDB5',
      refresh: '\uD83D\uDEAB',
      mic: '\uD83C\uDF99\uFE0F',
      clock: '\u23F0'
    };

    var grid = ui.createElement('div', { className: 'opic-rules-grid' });
    sim.examRules.forEach(function(rule, i) {
      var item = ui.createElement('div', { className: 'opic-rule-item' });
      item.appendChild(ui.createElement('div', { className: 'opic-rule-icon' }, ICONS[rule.icon] || '\u2139\uFE0F'));

      var check = ui.createElement('input', {
        type: 'checkbox',
        className: 'opic-rule-check',
        id: 'rule-check-' + i
      });
      check.addEventListener('change', updateBeginButton);
      item.appendChild(check);

      item.appendChild(ui.createElement('div', { className: 'opic-rule-title' }, rule.title));
      item.appendChild(ui.createElement('div', { className: 'opic-rule-desc' }, rule.desc));
      grid.appendChild(item);
    });
    root.appendChild(grid);

    // Warning box
    var warnBox = ui.createElement('div', { className: 'opic-warning-box' });
    warnBox.appendChild(ui.createElement('span', { className: 'warn-icon' }, '\u2139\uFE0F'));
    warnBox.appendChild(ui.createElement('span', {}, sim.examWarning));
    root.appendChild(warnBox);

    // Ready
    var ready = ui.createElement('div', { className: 'opic-ready' });
    ready.appendChild(ui.createElement('div', { className: 'opic-ready-text' }, '\uC900\uBE44\uB418\uC168\uB098\uC694?'));
    var beginBtn = ui.createElement('button', {
      className: 'opic-btn-begin',
      id: 'begin-btn',
      disabled: 'disabled'
    }, 'Begin \u203A');
    beginBtn.addEventListener('click', function() {
      renderExamConfirm();
    });
    ready.appendChild(beginBtn);
    root.appendChild(ready);
  }

  function updateBeginButton() {
    var checks = ui.$$('.opic-rule-check');
    var allChecked = checks.every(function(c) { return c.checked; });
    var btn = ui.$('#begin-btn');
    if (btn) btn.disabled = !allChecked;
  }

  // === Step 5: Confirm Modal ===
  function renderExamConfirm() {
    state.examPhase = 'confirm';
    var overlay = ui.createElement('div', { className: 'opic-confirm-overlay' });
    var box = ui.createElement('div', { className: 'opic-confirm-box' });
    box.appendChild(ui.createElement('div', { className: 'opic-confirm-text' }, '\uAC10\uB3C5\uAD00\uC758 \uC2DC\uD5D8 \uC2DC\uC791 \uC9C0\uC2DC\uB97C \uBC1B\uC558\uC2B5\uB2C8\uAE4C?'));

    var btns = ui.createElement('div', { className: 'opic-confirm-btns' });
    var yesBtn = ui.createElement('button', { className: 'opic-confirm-btn yes' }, 'YES');
    yesBtn.addEventListener('click', function() {
      overlay.remove();
      startExam();
    });
    var divider = ui.createElement('span', { className: 'opic-confirm-divider' }, '|');
    var noBtn = ui.createElement('button', { className: 'opic-confirm-btn no' }, 'NO');
    noBtn.addEventListener('click', function() {
      overlay.remove();
    });
    btns.appendChild(yesBtn);
    btns.appendChild(divider);
    btns.appendChild(noBtn);
    box.appendChild(btns);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  // === Start Exam ===
  function startExam() {
    // Survey 응답 기반 문제 생성
    var questionSelector = ChaoOPIc.core.questionSelector;
    state.questions = questionSelector.generate(state.surveyAnswers);

    // 디버깅용 요약 출력 (개발 시에만, 배포 시 제거 가능)
    if (console && console.log) {
      questionSelector.printSummary(state.questions);
    }

    state.recordings = new Array(state.questions.length);
    state.currentIndex = 0;
    state.replayUsed = {};
    state.examPhase = 'testing';

    // Timer
    state.examTimer = timer.create({
      duration: sim.settings.totalTimeMinutes * 60,
      countDown: true,
      onTick: function(remaining) {
        var display = ui.$('#opic-exam-timer');
        if (display) {
          display.textContent = timer.formatTime(remaining);
          display.className = 'opic-timer-inline';
          if (remaining <= 300) display.className += ' warning';
          if (remaining <= 60) display.className += ' danger';
        }
      },
      onComplete: function() {
        ui.showModal({
          title: '\uC2DC\uD5D8 \uC885\uB8CC',
          content: '<p>\uC2DC\uD5D8 \uC2DC\uAC04\uC774 \uC885\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.</p>',
          buttons: [{ label: '\uACB0\uACFC \uBCF4\uAE30', className: 'btn-primary', onClick: renderExamResult }]
        });
      }
    });
    state.examTimer.start();

    renderExamTesting();
  }

  // === Step 5: Testing ===
  function renderExamTesting() {
    var root = ui.$('#sim-root');
    var q = state.questions[state.currentIndex];
    var total = state.questions.length;
    root.innerHTML = '';

    // Header: Question X of Y + Timer
    var header = ui.createElement('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;' });
    header.appendChild(ui.createElement('h3', {}, 'Question ' + (state.currentIndex + 1) + ' of \u00A0' + total));
    header.appendChild(ui.createElement('span', {
      id: 'opic-exam-timer',
      className: 'opic-timer-inline'
    }, timer.formatTime(state.examTimer.getRemaining())));
    root.appendChild(header);
    root.appendChild(ui.createElement('hr', { style: 'border:none;border-top:2px solid #1565c0;margin-bottom:20px;' }));

    var layout = ui.createElement('div', { className: 'opic-exam-layout' });

    // Left: interviewer
    var left = ui.createElement('div', { className: 'opic-exam-left' });
    var interviewerWrap = ui.createElement('div', { className: 'opic-interviewer-wrap' });
    interviewerWrap.appendChild(ui.createElement('img', { src: 'images/interviewer-mai.png', alt: 'Interviewer' }));

    var playBar = ui.createElement('div', { className: 'opic-play-bar' });
    var playBtn = ui.createElement('button', { className: 'opic-play-btn', id: 'q-play-btn' }, '\u25B6');
    var qIndex = state.currentIndex;

    // 재생 횟수 초기화
    if (!state.playCount[qIndex]) {
      state.playCount[qIndex] = 0;
    }

    playBtn.addEventListener('click', function() {
      if (!state.replayUsed[qIndex]) {
        // First play
        state.playCount[qIndex]++;
        audio.play(q.audio, function() {
          // After first audio ends, immediately start recording
          console.log('[Simulation] Auto-starting recording after 1st play');
          startAutoRecording(qIndex);
          // Also enable replay window (5 sec)
          enableReplayWindow(qIndex);
        });
        state.replayUsed[qIndex] = 'played';
        playBtn.disabled = true;
        playBtn.style.opacity = '0.5';
      } else if (state.replayUsed[qIndex] === 'replay-ready') {
        // Replay (one-time) - 기존 녹음 삭제
        console.log('[Simulation] Replay clicked - stopping current recording');

        // 진행 중인 녹음 중지 및 삭제
        if (audio.recorder.isRecording()) {
          audio.recorder.stop(function() {
            console.log('[Simulation] Previous recording discarded');
          });
        }
        var volumeMeter = ui.$('.opic-volume-meter-container');
        if (volumeMeter && volumeMeter.stopMonitoring) {
          volumeMeter.stopMonitoring();
        }

        // 녹음 데이터 및 상태 초기화
        state.recordings[qIndex] = null;
        state.autoRecordingStarted[qIndex] = false;

        state.playCount[qIndex]++;
        audio.play(q.audio, function() {
          // After second audio ends, auto-start recording again
          console.log('[Simulation] Auto-starting recording after 2nd play');
          startAutoRecording(qIndex);
        });
        state.replayUsed[qIndex] = 'replay-done';
        playBtn.disabled = true;
        playBtn.style.opacity = '0.5';
      }
    });
    playBar.appendChild(playBtn);
    playBar.appendChild(ui.createElement('div', { className: 'opic-progress-track' }));
    interviewerWrap.appendChild(playBar);
    interviewerWrap.appendChild(ui.createElement('div', { className: 'opic-play-label' }, "Click 'PLAY' button to Listen"));
    left.appendChild(interviewerWrap);

    layout.appendChild(left);

    // Right: question grid + info
    var right = ui.createElement('div', { className: 'opic-exam-right' });

    right.appendChild(ui.createElement('div', { className: 'opic-q-grid-label' }, '\uBB38\uD56D \uC9C4\uD589:'));
    var grid = ui.createElement('div', { className: 'opic-q-grid' });
    for (var i = 0; i < total; i++) {
      var cls = 'opic-q-num';
      if (i === state.currentIndex) cls += ' current';
      else if (i < state.currentIndex) cls += ' done';
      else cls += ' upcoming';
      grid.appendChild(ui.createElement('div', { className: cls }, String(i + 1)));
    }
    right.appendChild(grid);

    // Info box
    var infoBox = ui.createElement('div', { className: 'opic-info-box' });
    infoBox.innerHTML = 'Play \uC544\uC774\uCF58(\u25B6)\uC744 \uB20C\uB7EC \uC9C8\uBB38\uC744 \uCCAD\uCDE8\uD558\uC2ED\uC2DC\uC624.<br><strong>\uC911\uC694!</strong> 5\uCD08 \uC774\uB0B4\uC5D0 \uBC84\uD2BC\uC744 \uB204\uB974\uBA74 \uC9C8\uBB38 \uB2E4\uC2DC\uB4E3\uAE30\uAC00 \uAC00\uB2A5\uD558\uBA70, \uC7AC\uCCAD\uCDE8\uB294 <strong>\uD55C\uBC88\uB9CC</strong> \uAC00\uB2A5\uD569\uB2C8\uB2E4.';
    right.appendChild(infoBox);

    // Volume Meter
    var volumeMeter = createVolumeMeter();
    right.appendChild(volumeMeter);

    layout.appendChild(right);
    root.appendChild(layout);

    // Navigation: Next only (no back)
    var nav = ui.createElement('div', { style: 'display:flex;justify-content:flex-end;margin-top:24px;' });
    var nextBtn = ui.createElement('button', { className: 'opic-btn-next' }, 'Next \u203A');
    nextBtn.addEventListener('click', function() {
      audio.stop();
      volumeMeter.stopMonitoring(); // 볼륨 모니터 중지
      if (audio.recorder.isRecording()) {
        audio.recorder.stop(function(blob) {
          state.recordings[qIndex] = blob;
          goNext();
        });
      } else {
        goNext();
      }
    });
    nav.appendChild(nextBtn);
    root.appendChild(nav);

    // Disable play if already done replaying
    if (state.replayUsed[qIndex] === 'replay-done' || state.replayUsed[qIndex] === 'played') {
      if (state.replayUsed[qIndex] !== 'replay-ready') {
        playBtn.disabled = true;
        playBtn.style.opacity = '0.5';
      }
    }
  }

  function enableReplayWindow(qIndex) {
    // 5 second window for replay
    if (state.replayTimer) clearTimeout(state.replayTimer);
    state.replayUsed[qIndex] = 'replay-ready';
    var playBtn = ui.$('#q-play-btn');
    if (playBtn) {
      playBtn.disabled = false;
      playBtn.style.opacity = '1';
    }
    state.replayTimer = setTimeout(function() {
      // 현재 문제가 같은지 확인 (Next로 넘어갔으면 비활성화하지 않음)
      if (state.currentIndex === qIndex && state.replayUsed[qIndex] === 'replay-ready') {
        // 5초 내에 재생하지 않았으면 재생 윈도우 종료
        state.replayUsed[qIndex] = 'replay-done';
        var btn = ui.$('#q-play-btn');
        if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }
      }
    }, 5000);
  }

  /**
   * 자동 녹음 시작 (문제 재생 완료 후)
   * @param {number} qIndex - 문제 인덱스
   */
  function startAutoRecording(qIndex) {
    if (state.autoRecordingStarted[qIndex]) return;
    state.autoRecordingStarted[qIndex] = true;

    var volumeMeter = ui.$('.opic-volume-meter-container');

    // 녹음 시작
    audio.recorder.start(function() {
      console.log('[Simulation] Auto-recording started');

      // 음량 미터 시작
      if (volumeMeter && volumeMeter.startMonitoring) {
        volumeMeter.startMonitoring();
      }

      ui.showToast('녹음이 자동으로 시작되었습니다.', 'info');
    });
  }

  function goNext() {
    if (state.currentIndex < state.questions.length - 1) {
      state.currentIndex++;
      renderExamTesting();
    } else {
      if (state.examTimer) state.examTimer.pause();
      renderExamResult();
    }
  }

  // === Save Section ===
  function renderSaveSection(root) {
    var recordedCount = state.recordings.filter(Boolean).length;

    if (recordedCount === 0) {
      return; // 녹음된 파일이 없으면 저장 섹션 표시 안 함
    }

    var saveSection = ui.createElement('div', { className: 'opic-save-section' });

    var title = ui.createElement('h3', { style: 'margin-bottom:12px;text-align:center;color:#1565c0;' }, '💾 녹음 파일 저장');
    saveSection.appendChild(title);

    var desc = ui.createElement('p', { style: 'text-align:center;color:#666;margin-bottom:16px;' },
      recordedCount + '개의 녹음 파일을 저장할 수 있습니다.');
    saveSection.appendChild(desc);

    var btnGroup = ui.createElement('div', { className: 'opic-save-btn-group' });

    // File System Access API 지원 브라우저: 폴더에 저장 버튼
    if (audio.fileSaver.isSupported()) {
      var saveFolderBtn = ui.createElement('button', { className: 'btn btn-primary' }, '📁 폴더에 저장');
      saveFolderBtn.addEventListener('click', function() {
        handleSaveToFolder();
      });
      btnGroup.appendChild(saveFolderBtn);
    }

    // 개별 다운로드 버튼 (항상 표시)
    var downloadBtn = ui.createElement('button', { className: 'btn btn-secondary' }, '⬇️ 개별 다운로드');
    downloadBtn.addEventListener('click', function() {
      handleDownloadFiles();
    });
    btnGroup.appendChild(downloadBtn);

    saveSection.appendChild(btnGroup);

    // 진행 상태 표시 영역 (처음엔 숨김)
    var progressDiv = ui.createElement('div', {
      id: 'save-progress',
      className: 'opic-save-progress',
      style: 'display:none;'
    });
    saveSection.appendChild(progressDiv);

    root.appendChild(saveSection);
  }

  function handleSaveToFolder() {
    var progressDiv = ui.$('#save-progress');
    var btnGroup = ui.$('.opic-save-btn-group');

    // 버튼 비활성화
    if (btnGroup) {
      var buttons = btnGroup.querySelectorAll('button');
      buttons.forEach(function(btn) { btn.disabled = true; });
    }

    // 진행 상태 표시
    if (progressDiv) {
      progressDiv.style.display = 'block';
      progressDiv.className = 'opic-save-progress';
      progressDiv.innerHTML = '폴더를 선택해주세요...';
    }

    audio.fileSaver.saveToDirectory(
      state.recordings,
      function onProgress(current, total) {
        if (progressDiv) {
          var percentage = Math.round((current / total) * 100);
          progressDiv.innerHTML = '저장 중: ' + current + ' / ' + total + ' (' + percentage + '%)';
        }
      },
      function onComplete(success, message) {
        if (progressDiv) {
          progressDiv.className = 'opic-save-progress ' + (success ? 'success' : 'error');
          progressDiv.innerHTML = (success ? '✅ ' : '❌ ') + message;
        }

        // 버튼 다시 활성화
        if (btnGroup) {
          var buttons = btnGroup.querySelectorAll('button');
          buttons.forEach(function(btn) { btn.disabled = false; });
        }

        ui.showToast(message, success ? 'success' : 'error');
      }
    );
  }

  function handleDownloadFiles() {
    var progressDiv = ui.$('#save-progress');
    var btnGroup = ui.$('.opic-save-btn-group');

    // 버튼 비활성화
    if (btnGroup) {
      var buttons = btnGroup.querySelectorAll('button');
      buttons.forEach(function(btn) { btn.disabled = true; });
    }

    // 진행 상태 표시
    if (progressDiv) {
      progressDiv.style.display = 'block';
      progressDiv.className = 'opic-save-progress';
      progressDiv.innerHTML = '다운로드 준비 중...';
    }

    audio.fileSaver.downloadFiles(
      state.recordings,
      function onProgress(current, total) {
        if (progressDiv) {
          var percentage = Math.round((current / total) * 100);
          progressDiv.innerHTML = '다운로드 중: ' + current + ' / ' + total + ' (' + percentage + '%)';
        }
      },
      function onComplete(success, message) {
        if (progressDiv) {
          progressDiv.className = 'opic-save-progress ' + (success ? 'success' : 'error');
          progressDiv.innerHTML = (success ? '✅ ' : '❌ ') + message;
        }

        // 버튼 다시 활성화
        if (btnGroup) {
          var buttons = btnGroup.querySelectorAll('button');
          buttons.forEach(function(btn) { btn.disabled = false; });
        }

        ui.showToast(message, success ? 'success' : 'error');
      }
    );
  }

  // === Result ===
  function renderExamResult() {
    state.examPhase = 'result';
    if (state.examTimer) { state.examTimer.pause(); state.examTimer = null; }
    var root = ui.$('#sim-root');
    root.innerHTML = '';

    root.appendChild(ui.createElement('h2', { className: 'section-title text-center' }, '\uC2DC\uD5D8 \uC644\uB8CC'));

    var stats = ui.createElement('div', { className: 'stats-bar' });
    stats.innerHTML =
      '<div class="stat-item"><div class="stat-value">' + state.questions.length + '</div><div class="stat-label">\uCD1D \uBB38\uD56D</div></div>' +
      '<div class="stat-item"><div class="stat-value">' + state.recordings.filter(Boolean).length + '</div><div class="stat-label">\uB179\uC74C \uC644\uB8CC</div></div>' +
      '<div class="stat-item"><div class="stat-value">' + (state.selfAssessLevel || '-') + '</div><div class="stat-label">\uC790\uAC00 \uD3C9\uAC00 \uB808\uBCA8</div></div>';
    root.appendChild(stats);

    // === 저장 버튼 섹션 ===
    renderSaveSection(root);

    state.questions.forEach(function(q, i) {
      var item = ui.createElement('div', { className: 'question-card' });
      item.appendChild(ui.createElement('p', { className: 'text-muted' }, '\uBB38\uD56D ' + (i + 1)));
      item.appendChild(ui.createElement('p', { className: 'question-text vi' }, q.text));
      if (q.translation) {
        item.appendChild(ui.createElement('p', { className: 'text-muted', style: 'font-size:0.9rem;' }, q.translation));
      }
      if (state.recordings[i]) {
        var playBtn = ui.createElement('button', { className: 'btn btn-secondary mt-md' }, '\u25B6 \uB0B4 \uB2F5\uBCC0 \uB4E3\uAE30');
        (function(blob) {
          playBtn.addEventListener('click', function() {
            var url = URL.createObjectURL(blob);
            var a = new Audio(url);
            a.play();
            a.onended = function() { URL.revokeObjectURL(url); };
          });
        })(state.recordings[i]);
        item.appendChild(playBtn);
      }
      root.appendChild(item);
    });

    var btnWrap = ui.createElement('div', { className: 'text-center mt-lg' });
    var retryBtn = ui.createElement('button', { className: 'btn btn-primary' }, '\uB2E4\uC2DC \uC2DC\uC791');
    retryBtn.addEventListener('click', function() {
      state.questions = [];
      state.recordings = [];
      state.currentIndex = 0;
      state.examTimer = null;
      state.surveyPart = 1;
      state.replayUsed = {};
      state.setupRecording = null;
      renderIntro();
    });
    btnWrap.appendChild(retryBtn);
    root.appendChild(btnWrap);
  }

  // === Init ===
  return {
    init: function() {
      loadSurvey();
      renderIntro();
    }
  };
})();
