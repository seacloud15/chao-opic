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

    shuffle: shuffle
  };
})();
