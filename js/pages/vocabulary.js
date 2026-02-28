/**
 * ChaoOPIc - Vocabulary Page Logic
 * 어휘 학습: 탭 기반 (학습 / 단어 목록 / 단어 추가)
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
    view: 'study', // 'study' | 'list' | 'add'
    allWords: [],
    dueCards: [],
    newCards: [],
    currentIndex: 0,
    showAnswer: false,
    srsData: {},
    stats: {},
    searchQuery: ''
  };

  // === 학습 대상 카드 준비 ===
  function prepareCards() {
    var words = dataLoader.getVocabulary();
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

  // === 상대 시간 표시 ===
  function formatRelativeTime(timestamp) {
    if (!timestamp) return '-';
    var now = Date.now();
    var diff = timestamp - now;

    if (diff <= 0) return '복습 가능';

    var minutes = Math.floor(diff / (60 * 1000));
    var hours = Math.floor(diff / (60 * 60 * 1000));
    var days = Math.floor(diff / (24 * 60 * 60 * 1000));

    if (days > 0) return days + '일 후';
    if (hours > 0) return hours + '시간 후';
    if (minutes > 0) return minutes + '분 후';
    return '곧';
  }

  // === 학습 상태 정보 ===
  function getStudyStatus(wordId) {
    var card = state.srsData[wordId];
    if (!card) return { label: '미학습', cls: 'badge-new' };
    if ((card.repetition || 0) >= 3) return { label: '숙지', cls: 'badge-mastered' };
    return { label: '학습중', cls: 'badge-learning' };
  }

  // === 메인 렌더링 ===
  function render() {
    var root = ui.$('#vocab-root');
    root.innerHTML = '';

    // 탭 네비게이션
    renderTabs(root);

    if (state.view === 'study') {
      renderStudyView(root);
    } else if (state.view === 'list') {
      renderListView(root);
    } else if (state.view === 'add') {
      renderAddView(root);
    }
  }

  // === 탭 렌더링 ===
  function renderTabs(root) {
    var tabs = ui.createElement('div', { className: 'vocab-tabs' });
    var tabItems = [
      { key: 'study', label: '학습' },
      { key: 'list', label: '단어 목록' },
      { key: 'add', label: '단어 추가' }
    ];

    tabItems.forEach(function(tab) {
      var cls = 'vocab-tab' + (state.view === tab.key ? ' vocab-tab--active' : '');
      var btn = ui.createElement('button', { className: cls }, tab.label);
      btn.addEventListener('click', function() {
        if (state.view !== tab.key) {
          state.view = tab.key;
          if (tab.key === 'study') {
            prepareCards();
            state.currentIndex = 0;
            state.showAnswer = false;
          } else if (tab.key === 'list') {
            state.srsData = storage.get('srs') || {};
            state.allWords = dataLoader.getVocabulary();
          }
          render();
        }
      });
      tabs.appendChild(btn);
    });
    root.appendChild(tabs);
  }

  // === 학습 뷰 ===
  function renderStudyView(root) {
    var word = getCurrentWord();

    // 통계 바
    var statsBar = ui.createElement('div', { className: 'stats-bar' });
    statsBar.innerHTML =
      '<div class="stat-item"><div class="stat-value">' + state.stats.todayReviewed + '</div><div class="stat-label">오늘 학습</div></div>' +
      '<div class="stat-item"><div class="stat-value">' + getTotalCards() + '</div><div class="stat-label">남은 카드</div></div>' +
      '<div class="stat-item"><div class="stat-value">' + state.dueCards.length + '</div><div class="stat-label">복습 대상</div></div>' +
      '<div class="stat-item"><div class="stat-value">' + state.newCards.length + '</div><div class="stat-label">새 카드</div></div>';
    root.appendChild(statsBar);

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
      var revealBtn = ui.createElement('button', { className: 'btn btn-primary mt-lg' }, '정답 확인');
      revealBtn.addEventListener('click', function() {
        state.showAnswer = true;
        render();
      });
      card.appendChild(revealBtn);
    }

    container.appendChild(card);
    root.appendChild(container);

    if (state.showAnswer) {
      renderSRSButtons(root, word);
    }
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

  // === 단어 목록 뷰 ===
  function renderListView(root) {
    var words = state.allWords;
    var srsData = state.srsData;

    // 검색 바
    var searchWrap = ui.createElement('div', { className: 'vocab-search-wrap' });
    var searchInput = ui.createElement('input', {
      type: 'text',
      className: 'vocab-search',
      placeholder: '단어 또는 뜻 검색...'
    });
    searchInput.value = state.searchQuery;
    searchInput.addEventListener('input', function() {
      state.searchQuery = this.value;
      renderWordList(listContainer, words, srsData);
    });
    searchWrap.appendChild(searchInput);

    var countSpan = ui.createElement('span', { className: 'vocab-count' }, '전체 ' + words.length + '개');
    searchWrap.appendChild(countSpan);
    root.appendChild(searchWrap);

    // 단어 리스트 컨테이너
    var listContainer = ui.createElement('div', { className: 'vocab-list-container' });
    root.appendChild(listContainer);
    renderWordList(listContainer, words, srsData);
  }

  function renderWordList(container, words, srsData) {
    container.innerHTML = '';
    var query = state.searchQuery.toLowerCase().trim();

    var filtered = words;
    if (query) {
      filtered = words.filter(function(w) {
        return w.word.toLowerCase().indexOf(query) !== -1 ||
               w.meaning.toLowerCase().indexOf(query) !== -1 ||
               (w.pronunciation && w.pronunciation.toLowerCase().indexOf(query) !== -1);
      });
    }

    if (filtered.length === 0) {
      container.appendChild(ui.createElement('div', { className: 'empty-message' }, '검색 결과가 없습니다.'));
      return;
    }

    // 테이블
    var table = ui.createElement('table', { className: 'vocab-table' });

    // 헤더
    var thead = ui.createElement('thead');
    var headerRow = ui.createElement('tr');
    ['단어', '발음', '뜻', '카테고리', '상태', '다음 복습', ''].forEach(function(h) {
      headerRow.appendChild(ui.createElement('th', {}, h));
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // 바디
    var tbody = ui.createElement('tbody');
    filtered.forEach(function(w) {
      var tr = ui.createElement('tr');
      var status = getStudyStatus(w.id);
      var card = srsData[w.id];
      var isCustom = w.id && w.id.indexOf('cv-') === 0;

      tr.appendChild(ui.createElement('td', { className: 'vocab-word-cell' }, w.word));
      tr.appendChild(ui.createElement('td', { className: 'vocab-pron-cell' }, w.pronunciation || '-'));
      tr.appendChild(ui.createElement('td', {}, w.meaning));
      tr.appendChild(ui.createElement('td', {}, w.category || '-'));

      var badgeTd = ui.createElement('td');
      badgeTd.appendChild(ui.createElement('span', { className: 'vocab-badge ' + status.cls }, status.label));
      tr.appendChild(badgeTd);

      tr.appendChild(ui.createElement('td', { className: 'vocab-next-review' }, card ? formatRelativeTime(card.nextReview) : '-'));

      // 삭제 버튼 (사용자 추가 단어만)
      var actionTd = ui.createElement('td');
      if (isCustom) {
        var delBtn = ui.createElement('button', { className: 'btn btn-danger btn-sm' }, '삭제');
        delBtn.addEventListener('click', function() {
          deleteCustomWord(w.id);
        });
        actionTd.appendChild(delBtn);
      }
      tr.appendChild(actionTd);

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  // === 단어 추가 뷰 ===
  function renderAddView(root) {
    var form = ui.createElement('div', { className: 'vocab-form' });

    form.appendChild(ui.createElement('h2', { className: 'section-title' }, '새 단어 추가'));

    var fields = [
      { id: 'word', label: '단어 (베트남어)', required: true, type: 'input' },
      { id: 'pronunciation', label: '발음', required: false, type: 'input' },
      { id: 'meaning', label: '뜻 (한국어)', required: true, type: 'input' },
      { id: 'example', label: '예문', required: false, type: 'input' },
      { id: 'exampleTranslation', label: '예문 번역', required: false, type: 'input' }
    ];

    var inputs = {};

    fields.forEach(function(f) {
      var group = ui.createElement('div', { className: 'vocab-form-group' });
      var label = ui.createElement('label', { className: 'vocab-form-label', for: 'vocab-' + f.id },
        f.label + (f.required ? ' *' : ''));
      group.appendChild(label);

      var input = ui.createElement('input', {
        type: 'text',
        id: 'vocab-' + f.id,
        className: 'vocab-form-input'
      });
      inputs[f.id] = input;
      group.appendChild(input);
      form.appendChild(group);
    });

    // 카테고리 선택
    var catGroup = ui.createElement('div', { className: 'vocab-form-group' });
    catGroup.appendChild(ui.createElement('label', { className: 'vocab-form-label' }, '카테고리'));
    var select = ui.createElement('select', { className: 'vocab-form-input', id: 'vocab-category' });
    var categories = dataLoader.getVocabularyCategories();
    categories.forEach(function(cat) {
      select.appendChild(ui.createElement('option', { value: cat }, cat));
    });
    select.appendChild(ui.createElement('option', { value: '__other__' }, '기타 (직접 입력)'));
    inputs.category = select;
    catGroup.appendChild(select);

    // 기타 직접 입력
    var otherInput = ui.createElement('input', {
      type: 'text',
      className: 'vocab-form-input vocab-form-other',
      placeholder: '카테고리를 입력하세요',
      style: 'display:none;margin-top:8px;'
    });
    inputs.categoryOther = otherInput;
    catGroup.appendChild(otherInput);
    form.appendChild(catGroup);

    select.addEventListener('change', function() {
      otherInput.style.display = this.value === '__other__' ? 'block' : 'none';
    });

    // 저장 버튼
    var btnWrap = ui.createElement('div', { className: 'vocab-form-actions' });
    var saveBtn = ui.createElement('button', { className: 'btn btn-primary' }, '단어 추가');
    saveBtn.addEventListener('click', function() {
      addWord(inputs);
    });
    btnWrap.appendChild(saveBtn);
    form.appendChild(btnWrap);

    root.appendChild(form);

    // 최근 추가 단어 목록
    renderRecentCustomWords(root);
  }

  function renderRecentCustomWords(root) {
    var customWords = dataLoader.getCustomWords();
    if (customWords.length === 0) return;

    var section = ui.createElement('div', { className: 'vocab-recent' });
    section.appendChild(ui.createElement('h3', { className: 'section-title' }, '내가 추가한 단어 (' + customWords.length + '개)'));

    var list = ui.createElement('div', { className: 'vocab-recent-list' });
    customWords.slice().reverse().forEach(function(w) {
      var item = ui.createElement('div', { className: 'vocab-recent-item' });
      item.appendChild(ui.createElement('span', { className: 'vocab-recent-word' }, w.word));
      item.appendChild(ui.createElement('span', { className: 'vocab-recent-meaning' }, w.meaning));
      item.appendChild(ui.createElement('span', { className: 'vocab-recent-cat' }, w.category || '-'));

      var delBtn = ui.createElement('button', { className: 'btn btn-danger btn-sm' }, '삭제');
      delBtn.addEventListener('click', function() {
        deleteCustomWord(w.id);
      });
      item.appendChild(delBtn);
      list.appendChild(item);
    });
    section.appendChild(list);
    root.appendChild(section);
  }

  // === 단어 추가 처리 ===
  function addWord(inputs) {
    var word = inputs.word.value.trim();
    var meaning = inputs.meaning.value.trim();

    if (!word || !meaning) {
      ui.showToast('단어와 뜻은 필수 입력 항목입니다.', 'error');
      return;
    }

    var category = inputs.category.value;
    if (category === '__other__') {
      category = inputs.categoryOther.value.trim() || '기타';
    }

    var newWord = {
      id: 'cv-' + Date.now(),
      word: word,
      meaning: meaning,
      pronunciation: inputs.pronunciation.value.trim() || '',
      example: inputs.example.value.trim() || '',
      exampleTranslation: inputs.exampleTranslation.value.trim() || '',
      category: category
    };

    var customWords = dataLoader.getCustomWords();
    customWords.push(newWord);
    dataLoader.saveCustomWords(customWords);

    // allWords 갱신
    state.allWords = dataLoader.getVocabulary();

    ui.showToast('"' + word + '" 단어가 추가되었습니다.', 'success');
    render();
  }

  // === 사용자 단어 삭제 ===
  function deleteCustomWord(wordId) {
    ui.showModal({
      title: '단어 삭제',
      content: '<p>이 단어를 삭제하시겠습니까?<br>관련 학습 기록도 함께 삭제됩니다.</p>',
      buttons: [
        { label: '취소', className: 'btn-secondary' },
        { label: '삭제', className: 'btn-danger', onClick: function() {
          var customWords = dataLoader.getCustomWords();
          customWords = customWords.filter(function(w) { return w.id !== wordId; });
          dataLoader.saveCustomWords(customWords);

          // SRS 데이터에서도 제거
          var srs = storage.get('srs') || {};
          delete srs[wordId];
          storage.set('srs', srs);
          state.srsData = srs;

          state.allWords = dataLoader.getVocabulary();
          ui.showToast('단어가 삭제되었습니다.', 'success');
          render();
        }}
      ]
    });
  }

  // === SRS 평가 ===
  function rateCard(word, quality) {
    var card = state.srsData[word.id] || SRS.createNew();
    var updated = SRS.calculate(card, quality);
    state.srsData[word.id] = updated;
    storage.set('srs', state.srsData);

    state.stats.todayReviewed++;
    state.stats.totalReviewed++;
    saveStats();

    state.currentIndex++;
    state.showAnswer = false;
    render();
  }

  // === 초기화 ===
  return {
    init: function() {
      loadStats();
      prepareCards();
      state.allWords = dataLoader.getVocabulary();
      state.srsData = storage.get('srs') || {};
      render();
    }
  };
})();
