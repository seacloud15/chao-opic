/**
 * ChaoOPIc - Topics Page Logic
 * 주제별 학습: 주제 목록 → 질문 학습 (음성, 스크립트, 해석, 녹음)
 */
ChaoOPIc.pages.topics = (function() {
  var ui = ChaoOPIc.core.ui;
  var audio = ChaoOPIc.core.audio;
  var dataLoader = ChaoOPIc.core.dataLoader;

  var state = {
    view: 'list',
    currentTopic: null,
    currentIndex: 0,
    showTranslation: false,
    showSample: false,
    recordingBlob: null
  };

  function renderTopicList() {
    state.view = 'list';
    var root = ui.$('#topics-root');
    var topics = dataLoader.getTopicList();

    root.innerHTML = '';
    root.appendChild(ui.createElement('h2', { className: 'section-title' }, '주제를 선택하세요'));
    root.appendChild(ui.createElement('p', { className: 'section-subtitle' }, '학습하고 싶은 주제를 클릭하면 질문 연습을 시작합니다.'));

    var grid = ui.createElement('div', { className: 'topic-grid' });

    topics.forEach(function(t) {
      var card = ui.createElement('div', { className: 'topic-card', 'data-id': t.id });
      card.appendChild(ui.createElement('span', { className: 'topic-icon' }, t.icon));
      card.appendChild(ui.createElement('div', { className: 'topic-title' }, t.title));
      card.appendChild(ui.createElement('div', { className: 'topic-count' }, t.questionCount + '개 질문'));
      card.addEventListener('click', function() {
        selectTopic(t.id);
      });
      grid.appendChild(card);
    });

    root.appendChild(grid);

    if (topics.length === 0) {
      root.appendChild(ui.createElement('p', { className: 'text-center text-muted mt-lg' }, '등록된 주제가 없습니다. js/data/topics/ 폴더에 데이터 파일을 추가하세요.'));
    }
  }

  function selectTopic(topicId) {
    var topic = dataLoader.getTopic(topicId);
    if (!topic || !topic.questions || topic.questions.length === 0) {
      ui.showToast('해당 주제에 질문이 없습니다.', 'error');
      return;
    }
    state.currentTopic = topic;
    state.currentIndex = 0;
    state.showTranslation = false;
    state.showSample = false;
    state.recordingBlob = null;
    renderQuestion();
  }

  function renderQuestion() {
    state.view = 'detail';
    var root = ui.$('#topics-root');
    var topic = state.currentTopic;
    var q = topic.questions[state.currentIndex];
    var total = topic.questions.length;

    root.innerHTML = '';

    // 뒤로가기
    var backLink = ui.createElement('a', { href: '#', className: 'back-link' }, '\u2190 주제 목록');
    backLink.addEventListener('click', function(e) {
      e.preventDefault();
      audio.stop();
      renderTopicList();
    });
    root.appendChild(backLink);

    // 제목 + 진행상황
    root.appendChild(ui.createElement('h2', { className: 'section-title' }, topic.icon + ' ' + topic.title));
    var progress = ui.createElement('div', { className: 'progress-container' });
    ui.renderProgress(progress, state.currentIndex + 1, total);
    root.appendChild(progress);

    // 질문 카드
    var card = ui.createElement('div', { className: 'question-card' });

    // 베트남어 질문
    card.appendChild(ui.createElement('p', { className: 'question-text vi' }, q.text));

    // 오디오 컨트롤
    var audioCtrl = ui.createElement('div', { className: 'audio-controls' });
    var playBtn = ui.createElement('button', { className: 'btn btn-primary btn-icon', title: '음성 재생' }, '\uD83D\uDD0A');
    playBtn.addEventListener('click', function() {
      audio.play(q.audio);
    });
    audioCtrl.appendChild(playBtn);

    // 녹음 버튼
    if (audio.recorder.isSupported()) {
      var recBtn = ui.createElement('button', { className: 'btn btn-danger btn-icon', title: '답변 녹음' }, '\uD83C\uDFA4');
      recBtn.addEventListener('click', function() {
        if (audio.recorder.isRecording()) {
          audio.recorder.stop(function(blob) {
            state.recordingBlob = blob;
            recBtn.textContent = '\uD83C\uDFA4';
            recBtn.classList.remove('btn-success');
            recBtn.classList.add('btn-danger');
            ui.showToast('녹음이 저장되었습니다.', 'success');
            renderPlayback();
          });
        } else {
          audio.recorder.start(function() {
            recBtn.textContent = '\u23F9';
            recBtn.classList.remove('btn-danger');
            recBtn.classList.add('btn-success');
          });
        }
      });
      audioCtrl.appendChild(recBtn);
    }

    // 내 녹음 재생
    var playbackContainer = ui.createElement('span', { id: 'playback-container' });
    audioCtrl.appendChild(playbackContainer);
    card.appendChild(audioCtrl);

    // 한국어 해석 토글
    var transBtn = ui.createElement('button', { className: 'btn btn-secondary mt-md' }, state.showTranslation ? '한국어 해석 숨기기 \u25B2' : '한국어 해석 보기 \u25BC');
    var transContent = ui.createElement('div', { className: 'translation-toggle' + (state.showTranslation ? '' : ' hidden') }, q.translation);
    transBtn.addEventListener('click', function() {
      state.showTranslation = !state.showTranslation;
      transContent.classList.toggle('hidden');
      transBtn.textContent = state.showTranslation ? '한국어 해석 숨기기 \u25B2' : '한국어 해석 보기 \u25BC';
    });
    card.appendChild(transBtn);
    card.appendChild(transContent);

    // 모범 답변 토글
    if (q.sampleAnswer) {
      var sampleBtn = ui.createElement('button', { className: 'btn btn-secondary mt-md' }, state.showSample ? '모범 답변 숨기기 \u25B2' : '모범 답변 보기 \u25BC');
      var sampleHtml = '<p style="color:#1e40af;margin-bottom:8px;">' + q.sampleAnswer + '</p>';
      if (q.sampleTranslation) {
        sampleHtml += '<p style="color:#6b7280;font-size:0.9rem;">' + q.sampleTranslation + '</p>';
      }
      var sampleContent = ui.createElement('div', { className: 'translation-toggle' + (state.showSample ? '' : ' hidden'), innerHTML: sampleHtml });
      sampleBtn.addEventListener('click', function() {
        state.showSample = !state.showSample;
        sampleContent.classList.toggle('hidden');
        sampleBtn.textContent = state.showSample ? '모범 답변 숨기기 \u25B2' : '모범 답변 보기 \u25BC';
      });
      card.appendChild(sampleBtn);
      card.appendChild(sampleContent);
    }

    root.appendChild(card);

    // 이전/다음 네비게이션
    var nav = ui.createElement('div', { className: 'question-nav' });
    var prevBtn = ui.createElement('button', {
      className: 'btn btn-secondary',
      disabled: state.currentIndex === 0 ? 'disabled' : null
    }, '\u2190 이전');
    prevBtn.addEventListener('click', function() {
      if (state.currentIndex > 0) {
        audio.stop();
        state.currentIndex--;
        state.showTranslation = false;
        state.showSample = false;
        state.recordingBlob = null;
        renderQuestion();
      }
    });

    var nextBtn = ui.createElement('button', {
      className: 'btn btn-primary',
      disabled: state.currentIndex >= total - 1 ? 'disabled' : null
    }, '다음 \u2192');
    nextBtn.addEventListener('click', function() {
      if (state.currentIndex < total - 1) {
        audio.stop();
        state.currentIndex++;
        state.showTranslation = false;
        state.showSample = false;
        state.recordingBlob = null;
        renderQuestion();
      }
    });

    nav.appendChild(prevBtn);
    nav.appendChild(ui.createElement('span', { className: 'text-muted' }, (state.currentIndex + 1) + ' / ' + total));
    nav.appendChild(nextBtn);
    root.appendChild(nav);
  }

  function renderPlayback() {
    var container = ui.$('#playback-container');
    if (!container || !state.recordingBlob) return;
    container.innerHTML = '';
    var playMyBtn = ui.createElement('button', { className: 'btn btn-secondary btn-icon', title: '내 녹음 재생' }, '\u25B6');
    playMyBtn.addEventListener('click', function() {
      var url = URL.createObjectURL(state.recordingBlob);
      var a = new Audio(url);
      a.play();
      a.onended = function() { URL.revokeObjectURL(url); };
    });
    container.appendChild(playMyBtn);
  }

  return {
    init: function() {
      renderTopicList();
    }
  };
})();
