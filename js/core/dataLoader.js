/**
 * ChaoOPIc - DataLoader Module
 * 데이터 검증, 조회, 셔플 유틸
 */
ChaoOPIc.core.dataLoader = (function() {
  // Fisher-Yates 셔플
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  return {
    // 등록된 주제 목록 반환
    getTopicList: function() {
      var topics = ChaoOPIc.data.topics;
      var list = [];
      Object.keys(topics).forEach(function(key) {
        var t = topics[key];
        if (t && t.id && t.title) {
          list.push({
            id: t.id,
            title: t.title,
            titleVi: t.titleVi || '',
            icon: t.icon || '📖',
            questionCount: (t.questions || []).length
          });
        }
      });
      return list;
    },

    // 특정 주제 데이터 반환
    getTopic: function(topicId) {
      var topic = ChaoOPIc.data.topics[topicId];
      if (!topic) {
        console.warn('[DataLoader] 주제를 찾을 수 없습니다:', topicId);
        return null;
      }
      return topic;
    },

    // 어휘 데이터 반환 (카테고리 필터)
    getVocabulary: function(category) {
      var data = ChaoOPIc.data.vocabulary;
      if (!data || !data.words) return [];
      if (!category || category === 'all') return data.words;
      return data.words.filter(function(w) {
        return w.category === category;
      });
    },

    // 어휘 카테고리 목록 반환
    getVocabularyCategories: function() {
      var data = ChaoOPIc.data.vocabulary;
      return (data && data.categories) ? data.categories : [];
    },

    // 시뮬레이션 질문 반환 (필터 + 셔플)
    getSimulationQuestions: function(categories, difficulty, count) {
      var sim = ChaoOPIc.data.simulation;
      if (!sim || !sim.questions) return [];

      var filtered = sim.questions.filter(function(q) {
        var catMatch = !categories || categories.length === 0 || categories.indexOf(q.category) !== -1;
        var diffMatch = !difficulty || q.difficulty === difficulty;
        return catMatch && diffMatch;
      });

      var shuffled = shuffle(filtered);
      return count ? shuffled.slice(0, count) : shuffled;
    },

    // 시뮬레이션 설정 반환
    getSimulationConfig: function() {
      var sim = ChaoOPIc.data.simulation;
      return (sim && sim.settings) ? sim.settings : {
        totalTimeMinutes: 40,
        questionsPerSession: 12,
        preparationTimeSec: 20
      };
    },

    // Survey 카테고리 반환
    getSurveyCategories: function() {
      var sim = ChaoOPIc.data.simulation;
      return (sim && sim.surveyCategories) ? sim.surveyCategories : [];
    },

    // 난이도 목록 반환
    getDifficultyLevels: function() {
      var sim = ChaoOPIc.data.simulation;
      return (sim && sim.difficultyLevels) ? sim.difficultyLevels : [];
    },

    // localStorage에서 오디오 인덱스 로드
    loadAudioIndex: function() {
      try {
        var data = localStorage.getItem('chaoopic_audio_index');
        if (!data) return null;
        return JSON.parse(data);
      } catch (error) {
        console.error('[DataLoader] Failed to load audio index:', error);
        return null;
      }
    },

    // 인덱스를 topics 구조로 변환
    convertIndexToTopics: function(index, categoryId) {
      if (!index || !index[categoryId]) {
        console.log('[DataLoader] No data for category:', categoryId);
        return [];
      }

      var categoryData = index[categoryId];
      var folders = [];
      var iconMap = {
        'survey': '📝',
        'non-survey': '💬',
        'rolePlay': '🎭',
        'issueComparison': '⚡'
      };
      var defaultIcon = iconMap[categoryId] || '📁';

      console.log('[DataLoader] Converting category:', categoryId, 'Topics:', Object.keys(categoryData).length);

      // 카테고리별 처리
      if (typeof categoryData === 'object' && !Array.isArray(categoryData)) {
        // survey, non-survey, rolePlay, issueComparison
        Object.keys(categoryData).forEach(function(topicName) {
          var files = categoryData[topicName];
          if (Array.isArray(files) && files.length > 0) {
            var scriptCount = files.filter(function(f) { return f.hasScript; }).length;
            console.log('[DataLoader] Topic:', topicName, 'Files:', files.length, 'Scripts:', scriptCount);

            folders.push({
              id: topicName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase(),
              name: topicName,
              icon: defaultIcon,
              files: files.map(function(file, index) {
                return {
                  id: file.fileName ? file.fileName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() : 'file-' + index,
                  audioFile: file.audioFile,
                  scriptFile: file.scriptFile,
                  scriptContent: file.scriptContent || null,
                  title: file.title || file.fileName || '문제 ' + (index + 1)
                };
              })
            });
          }
        });
      }

      console.log('[DataLoader] Converted folders:', folders.length);
      return folders;
    },

    // 전체 카테고리 목록 반환
    getCategories: function() {
      // 정적 카테고리 정의 (categories.js 없이도 동작)
      return ChaoOPIc.data.topics.categories || [
        {
          id: 'survey',
          title: 'Survey',
          titleKo: '서베이',
          icon: '📝',
          description: '자기소개 및 관심사 질문'
        },
        {
          id: 'non-survey',
          title: 'Non-Survey',
          titleKo: '비서베이',
          icon: '💬',
          description: '일상 대화 주제'
        },
        {
          id: 'rolePlay',
          title: 'Role Play',
          titleKo: '롤플레이',
          icon: '🎭',
          description: '역할극 시나리오'
        },
        {
          id: 'issueComparison',
          title: 'Issue Comparison',
          titleKo: '돌발/비교',
          icon: '⚡',
          description: '돌발 질문 및 비교 설명'
        }
      ];
    },

    // 카테고리의 폴더 목록 반환
    getCategoryFolders: function(categoryId) {
      // 먼저 localStorage의 인덱스 확인
      var index = this.loadAudioIndex();
      if (index) {
        var folders = this.convertIndexToTopics(index, categoryId);
        if (folders.length > 0) {
          return folders;
        }
      }

      // 인덱스가 없으면 정적 데이터 사용 (fallback)
      var categoryData = ChaoOPIc.data.topics[categoryId];
      return (categoryData && categoryData.folders) || [];
    },

    // 특정 폴더 데이터 반환
    getFolder: function(categoryId, folderId) {
      var folders = this.getCategoryFolders(categoryId);
      return folders.find(function(f) { return f.id === folderId; }) || null;
    },

    // 폴더의 파일 목록 반환
    getFolderFiles: function(categoryId, folderId) {
      var folder = this.getFolder(categoryId, folderId);
      return (folder && folder.files) || [];
    },

    shuffle: shuffle
  };
})();
