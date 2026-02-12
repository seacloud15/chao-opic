/**
 * ChaoOPIc - Vocabulary Page Logic
 * 어휘 학습: AnkiDroid식 간격 반복 학습 (SM-2 변형)
 */
ChaoOPIc.pages.vocabulary = (function() {
  var ui = ChaoOPIc.core.ui;
  var storage = ChaoOPIc.core.storage;
  var dataLoader = ChaoOPIc.core.dataLoader;

  // === SRS 알고리즘 (SM-2 변형) ===
  var SRS = {
    INTERVALS: {
      again: 1 * 60 * 1000,
      hard:  10 * 60 * 1000,
      good:  1 * 24 * 60 * 60 * 1000,
      easy:  4 * 24 * 60 * 60 * 1000
    },

    calculate: function(card, quality) {
      var qualityNum = { again: 0, hard: 1, good: 2, easy: 3 }[quality];
      var now = Date.now();

      if (qualityNum < 2) {
        return {
          interval: this.INTERVALS[quality],
          repetition: 0,
          easeFactor: Math.max(1.3, (card.easeFactor || 2.5) - 0.2),
          nextReview: now + this.INTERVALS[quality],
          lastReview: now
        };
      }

      var newRep = (card.repetition || 0) + 1;
      var newEF = (card.easeFactor || 2.5) + (0.1 - (3 - qualityNum) * 0.08);
      newEF = Math.max(1.3, newEF);

      var newInterval;
      if (newRep <= 1) {
        newInterval = this.INTERVALS[quality];
      } else {
        newInterval = (card.interval || this.INTERVALS[quality]) * newEF;
      }

      return {
        interval: newInterval,
        repetition: newRep,
        easeFactor: newEF,
        nextReview: now + newInterval,
        lastReview: now
      };
    },

    createNew: function() {
      return {
        interval: 0,
        repetition: 0,
        easeFactor: 2.5,
        nextReview: 0,
        lastReview: 0
      };
    }
  };

  // === State ===
  var state = {
    allWords: [],
    dueCards: [],
    newCards: [],
    currentIndex: 0,
    showAnswer: false,
    filter: 'all',
    srsData: {},
    stats: {}
  };

  // === 학습 대상 카드 준비 ===
  function prepareCards() {
    var words = dataLoader.getVocabulary(state.filter === 'all' ? null : state.filter);
    state.allWords = words;
    state.srsData = storage.get('srs') || {};

    var now = Date.now();
    state.dueCards = [];
    state.newCards = [];

    words.forEach(function(w) {
      var card = state.srsData[w.id];
      if (!card) {
        state.newCards.push(w);
      } else if (card.nextReview <= now) {
        state.dueCards.push(w);
      }
    });

    // 복습 카드 먼저, 그 다음 새 카드
    state.dueCards = dataLoader.shuffle(state.dueCards);
    state.newCards = dataLoader.shuffle(state.newCards);
  }

  function getCurrentWord() {
    var totalDue = state.dueCards.length;
    if (state.currentIndex < totalDue) {
      return state.dueCards[state.currentIndex];
    }
    var newIdx = state.currentIndex - totalDue;
    if (newIdx < state.newCards.length) {
      return state.newCards[newIdx];
    }
    return null;
  }

  function getTotalCards() {
    return state.dueCards.length + state.newCards.length;
  }

  // === 통계 관리 ===
  function loadStats() {
    state.stats = storage.get('stats') || {
      totalReviewed: 0,
      todayReviewed: 0,
      todayDate: '',
      streak: 0
    };
    var today = new Date().toISOString().slice(0, 10);
    if (state.stats.todayDate !== today) {
      if (state.stats.todayDate && state.stats.todayReviewed > 0) {
        state.stats.streak = (state.stats.streak || 0) + 1;
      }
      state.stats.todayReviewed = 0;
      state.stats.todayDate = today;
    }
  }

  function saveStats() {
    storage.set('stats', state.stats);
  }

  // === 렌더링 ===
  function render() {
    var root = ui.$('#vocab-root');
    root.innerHTML = '';

    var word = getCurrentWord();

    // 필터 + 통계
    renderHeader(root);

    if (!word) {
      renderComplete(root);
      return;
    }

    // 진행상황
    var progress = ui.createElement('div', { className: 'progress-container' });
    ui.renderProgress(progress, state.currentIndex + 1, getTotalCards());
    root.appendChild(progress);

    // 플립 카드
    var container = ui.createElement('div', { className: 'flip-card-container' });
    var card = ui.createElement('div', { className: 'flip-card' });

    card.appendChild(ui.createElement('div', { className: 'word' }, word.word));
    if (word.pronunciation) {
      card.appendChild(ui.createElement('div', { className: 'pronunciation' }, '(' + word.pronunciation + ')'));
    }

    if (state.showAnswer) {
      // 뒷면: 뜻 + 예문
      card.appendChild(ui.createElement('div', { className: 'meaning' }, word.meaning));
      if (word.example) {
        var exDiv = ui.createElement('div', { className: 'example' });
        exDiv.appendChild(ui.createElement('div', {}, word.example));
        if (word.exampleTranslation) {
          exDiv.appendChild(ui.createElement('div', { className: 'example-translation' }, word.exampleTranslation));
        }
        card.appendChild(exDiv);
      }
    } else {
      // 앞면: 정답 확인 버튼
      var revealBtn = ui.createElement('button', { className: 'btn btn-primary mt-lg' }, '정답 확인');
      revealBtn.addEventListener('click', function() {
        state.showAnswer = true;
        render();
      });
      card.appendChild(revealBtn);
    }

    container.appendChild(card);
    root.appendChild(container);

    // SRS 버튼 (뒷면일 때만)
    if (state.showAnswer) {
      renderSRSButtons(root, word);
    }
  }

  function renderHeader(root) {
    // 통계 바
    var statsBar = ui.createElement('div', { className: 'stats-bar' });
    statsBar.innerHTML =
      '<div class="stat-item"><div class="stat-value">' + state.stats.todayReviewed + '</div><div class="stat-label">오늘 학습</div></div>' +
      '<div class="stat-item"><div class="stat-value">' + getTotalCards() + '</div><div class="stat-label">남은 카드</div></div>' +
      '<div class="stat-item"><div class="stat-value">' + state.dueCards.length + '</div><div class="stat-label">복습 대상</div></div>' +
      '<div class="stat-item"><div class="stat-value">' + state.newCards.length + '</div><div class="stat-label">새 카드</div></div>';
    root.appendChild(statsBar);

    // 카테고리 필터
    var categories = dataLoader.getVocabularyCategories();
    if (categories.length > 0) {
      var filterWrap = ui.createElement('div', { className: 'text-center mb-lg' });
      var allBtn = createFilterBtn('전체', 'all');
      filterWrap.appendChild(allBtn);
      categories.forEach(function(cat) {
        filterWrap.appendChild(createFilterBtn(cat, cat));
      });
      root.appendChild(filterWrap);
    }
  }

  function createFilterBtn(label, value) {
    var cls = 'btn ' + (state.filter === value ? 'btn-primary' : 'btn-secondary');
    var btn = ui.createElement('button', { className: cls, style: 'margin:4px;' }, label);
    btn.addEventListener('click', function() {
      if (state.filter !== value) {
        state.filter = value;
        state.currentIndex = 0;
        state.showAnswer = false;
        prepareCards();
        render();
      }
    });
    return btn;
  }

  function renderSRSButtons(root, word) {
    var btns = ui.createElement('div', { className: 'srs-buttons' });
    var ratings = [
      { key: 'again', label: '다시', interval: '<1분', cls: 'srs-again' },
      { key: 'hard',  label: '어려움', interval: '<10분', cls: 'srs-hard' },
      { key: 'good',  label: '보통', interval: '<1일', cls: 'srs-good' },
      { key: 'easy',  label: '쉬움', interval: '<4일', cls: 'srs-easy' }
    ];

    ratings.forEach(function(r) {
      var btn = ui.createElement('button', { className: 'srs-btn ' + r.cls });
      btn.appendChild(ui.createElement('span', { className: 'srs-label' }, r.label));
      btn.appendChild(ui.createElement('span', { className: 'srs-interval' }, r.interval));
      btn.addEventListener('click', function() {
        rateCard(word, r.key);
      });
      btns.appendChild(btn);
    });

    root.appendChild(btns);
  }

  function renderComplete(root) {
    var wrap = ui.createElement('div', { className: 'text-center mt-lg' });
    wrap.appendChild(ui.createElement('h2', { className: 'section-title' }, '학습 완료!'));
    wrap.appendChild(ui.createElement('p', { className: 'text-muted mb-lg' }, '오늘 학습할 카드를 모두 완료했습니다.'));

    var resetBtn = ui.createElement('button', { className: 'btn btn-secondary' }, '처음부터 다시');
    resetBtn.addEventListener('click', function() {
      state.currentIndex = 0;
      state.showAnswer = false;
      prepareCards();
      render();
    });

    var clearBtn = ui.createElement('button', { className: 'btn btn-danger', style: 'margin-left:8px;' }, '학습 기록 초기화');
    clearBtn.addEventListener('click', function() {
      ui.showModal({
        title: '학습 기록 초기화',
        content: '<p>모든 SRS 학습 기록이 삭제됩니다. 계속하시겠습니까?</p>',
        buttons: [
          { label: '취소', className: 'btn-secondary' },
          { label: '초기화', className: 'btn-danger', onClick: function() {
            storage.remove('srs');
            storage.remove('stats');
            state.srsData = {};
            loadStats();
            state.currentIndex = 0;
            state.showAnswer = false;
            prepareCards();
            render();
            ui.showToast('학습 기록이 초기화되었습니다.', 'success');
          }}
        ]
      });
    });

    wrap.appendChild(resetBtn);
    wrap.appendChild(clearBtn);
    root.appendChild(wrap);
  }

  // === SRS 평가 ===
  function rateCard(word, quality) {
    var card = state.srsData[word.id] || SRS.createNew();
    var updated = SRS.calculate(card, quality);
    state.srsData[word.id] = updated;
    storage.set('srs', state.srsData);

    // 통계 업데이트
    state.stats.todayReviewed++;
    state.stats.totalReviewed++;
    saveStats();

    // 다음 카드
    state.currentIndex++;
    state.showAnswer = false;
    render();
  }

  // === 초기화 ===
  return {
    init: function() {
      loadStats();
      prepareCards();
      render();
    }
  };
})();
