/**
 * ChaoOPIc - Topics Page Logic
 * 주제별 학습: 카테고리 선택 → 폴더 선택 → 파일 리스트 (음성 재생 + 스크립트 보기)
 */
ChaoOPIc.pages.topics = (function() {
  var ui = ChaoOPIc.core.ui;
  var audio = ChaoOPIc.core.audio;
  var dataLoader = ChaoOPIc.core.dataLoader;

  var state = {
    view: 'categories',      // 'categories' | 'folders' | 'files'
    currentCategory: null,   // 선택된 카테고리 ID
    currentFolder: null,     // 선택된 폴더 ID
    currentFileIndex: 0,     // 현재 파일 인덱스
    playingFileId: null,     // 재생 중인 파일 ID
    expandedScripts: {}      // { fileId: true/false } 스크립트 펼침 상태
  };

  // ============================================
  // View Renderers
  // ============================================

  /**
   * 카테고리 선택 화면 렌더링
   */
  function renderCategories() {
    state.view = 'categories';
    var root = document.getElementById('topics-root');
    root.innerHTML = '';

    var title = ui.createElement('h2', { className: 'section-title' }, '주제별 학습');
    var subtitle = ui.createElement('p', { className: 'section-subtitle' }, '카테고리를 선택하세요');
    root.appendChild(title);
    root.appendChild(subtitle);

    var grid = ui.createElement('div', { className: 'topic-grid' });
    var categories = dataLoader.getCategories();

    categories.forEach(function(category) {
      var folderCount = dataLoader.getCategoryFolders(category.id).length;
      var card = ui.createElement('div', {
        className: 'topic-card',
        'data-category': category.id
      });

      card.addEventListener('click', function() {
        handleCategoryClick(category.id);
      });

      card.appendChild(ui.createElement('span', { className: 'topic-icon' }, category.icon));
      card.appendChild(ui.createElement('div', { className: 'topic-title' }, category.title));
      card.appendChild(ui.createElement('div', { className: 'topic-subtitle' }, category.titleKo));
      card.appendChild(ui.createElement('div', { className: 'topic-count' }, folderCount + '개 주제'));

      grid.appendChild(card);
    });

    root.appendChild(grid);

    if (categories.length === 0) {
      root.appendChild(ui.createElement('div', { className: 'empty-message' },
        '카테고리가 없습니다. js/data/topics/categories.js 파일을 확인하세요.'
      ));
    }
  }

  /**
   * 폴더 리스트 화면 렌더링
   */
  function renderFolders(categoryId) {
    state.view = 'folders';
    state.currentCategory = categoryId;
    var root = document.getElementById('topics-root');
    root.innerHTML = '';

    var categories = dataLoader.getCategories();
    var category = categories.find(function(c) { return c.id === categoryId; });
    if (!category) {
      ui.showToast('카테고리를 찾을 수 없습니다.', 'error');
      renderCategories();
      return;
    }

    var folders = dataLoader.getCategoryFolders(categoryId);

    // Back link
    var backLink = ui.createElement('a', {
      href: '#',
      className: 'back-link'
    }, '← 카테고리 목록');
    backLink.addEventListener('click', function(e) {
      e.preventDefault();
      handleBackNavigation();
    });
    root.appendChild(backLink);

    // Title
    var title = ui.createElement('h2', { className: 'section-title' }, category.icon + ' ' + category.title);
    var subtitle = ui.createElement('p', { className: 'section-subtitle' },
      '학습할 주제를 선택하세요 (' + folders.length + '개 주제)');
    root.appendChild(title);
    root.appendChild(subtitle);

    // Folder grid
    var grid = ui.createElement('div', { className: 'topic-grid' });
    folders.forEach(function(folder) {
      var card = ui.createElement('div', {
        className: 'topic-card',
        'data-folder-id': folder.id
      });

      card.addEventListener('click', function() {
        handleFolderClick(folder.id);
      });

      card.appendChild(ui.createElement('span', { className: 'topic-icon' }, folder.icon));
      card.appendChild(ui.createElement('div', { className: 'topic-title' }, folder.name));
      card.appendChild(ui.createElement('div', { className: 'topic-count' }, folder.files.length + '개 문제'));

      grid.appendChild(card);
    });

    root.appendChild(grid);

    if (folders.length === 0) {
      root.appendChild(ui.createElement('div', { className: 'empty-message' },
        '이 카테고리에 주제가 없습니다.'
      ));
    }
  }

  /**
   * 파일 리스트 화면 렌더링
   */
  function renderFiles(categoryId, folderId) {
    state.view = 'files';
    state.currentCategory = categoryId;
    state.currentFolder = folderId;
    var root = document.getElementById('topics-root');
    root.innerHTML = '';

    var folder = dataLoader.getFolder(categoryId, folderId);
    if (!folder) {
      ui.showToast('폴더를 찾을 수 없습니다.', 'error');
      renderFolders(categoryId);
      return;
    }

    var files = folder.files;

    // Back link
    var backLink = ui.createElement('a', {
      href: '#',
      className: 'back-link'
    }, '← 주제 목록');
    backLink.addEventListener('click', function(e) {
      e.preventDefault();
      handleBackNavigation();
    });
    root.appendChild(backLink);

    // Title
    var title = ui.createElement('h2', { className: 'section-title' }, folder.icon + ' ' + folder.name);
    root.appendChild(title);

    // Progress
    var progressContainer = ui.createElement('div', { className: 'progress-container' });
    ui.renderProgress(progressContainer, state.currentFileIndex + 1, files.length);
    root.appendChild(progressContainer);

    // File list
    var fileList = ui.createElement('div', { className: 'file-list' });

    files.forEach(function(file, index) {
      var fileItem = ui.createElement('div', {
        className: 'file-item',
        'data-file-id': file.id
      });

      var fileTitle = ui.createElement('div', { className: 'file-title' }, (index + 1) + '. ' + file.title);
      fileItem.appendChild(fileTitle);

      // Action buttons
      var actions = ui.createElement('div', { className: 'file-actions' });

      var playBtn = ui.createElement('button', {
        className: 'btn btn-primary btn-sm play-btn'
      }, '🔊 재생');
      playBtn.addEventListener('click', function() {
        state.currentFileIndex = index;
        handlePlayClick(file);
      });
      actions.appendChild(playBtn);

      var scriptBtn = ui.createElement('button', {
        className: 'btn btn-secondary btn-sm script-btn'
      }, state.expandedScripts[file.id] ? '📄 스크립트 숨기기 ▲' : '📄 스크립트 보기 ▼');
      scriptBtn.addEventListener('click', function() {
        handleScriptToggle(file.id);
      });
      actions.appendChild(scriptBtn);

      fileItem.appendChild(actions);

      // Script content
      var scriptContent = ui.createElement('div', {
        className: 'script-content' + (state.expandedScripts[file.id] ? '' : ' hidden')
      });

      if (state.expandedScripts[file.id]) {
        if (file.scriptContent) {
          // 스크립트 내용이 localStorage에 저장되어 있음
          scriptContent.textContent = file.scriptContent;
        } else {
          // 스크립트 파일이 없음
          scriptContent.textContent = '스크립트 파일이 없습니다.';
          scriptContent.style.color = 'var(--color-text-light)';
        }
      }

      fileItem.appendChild(scriptContent);
      fileList.appendChild(fileItem);
    });

    root.appendChild(fileList);

    if (files.length === 0) {
      root.appendChild(ui.createElement('div', { className: 'empty-message' },
        '이 주제에 문제가 없습니다.'
      ));
    }
  }

  // ============================================
  // Event Handlers
  // ============================================

  /**
   * 카테고리 선택 처리
   */
  function handleCategoryClick(categoryId) {
    renderFolders(categoryId);
  }

  /**
   * 폴더 선택 처리
   */
  function handleFolderClick(folderId) {
    renderFiles(state.currentCategory, folderId);
  }

  /**
   * 오디오 재생 처리
   */
  function handlePlayClick(file) {
    audio.stop();

    ui.showToast('오디오 파일을 재생합니다.', 'info');

    audio.play(file.audioFile, function onEnded() {
      state.playingFileId = null;
    });

    state.playingFileId = file.id;
  }

  /**
   * 스크립트 토글 처리 (localStorage에서 직접 읽기)
   */
  function handleScriptToggle(fileId) {
    // 단순 토글 (스크립트 내용은 이미 file.scriptContent에 저장되어 있음)
    state.expandedScripts[fileId] = !state.expandedScripts[fileId];
    renderFiles(state.currentCategory, state.currentFolder);
  }

  /**
   * 뒤로가기 네비게이션
   */
  function handleBackNavigation() {
    audio.stop();

    if (state.view === 'files') {
      state.view = 'folders';
      state.currentFolder = null;
      state.expandedScripts = {};
      renderFolders(state.currentCategory);
    } else if (state.view === 'folders') {
      state.view = 'categories';
      state.currentCategory = null;
      renderCategories();
    }
  }

  // ============================================
  // Helper Functions
  // ============================================
  // (스크립트 로딩 함수 제거 - localStorage에서 직접 읽음)

  // ============================================
  // Public API
  // ============================================

  return {
    init: function() {
      renderCategories();
    }
  };
})();
