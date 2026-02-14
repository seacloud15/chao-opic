/**
 * ChaoOPIc - File Scanner Module
 * audioFileIndex를 사용하여 파일 조회
 *
 * IIFE 패턴, ChaoOPIc.core.fileScanner 네임스페이스
 */
ChaoOPIc.core.fileScanner = (function() {
  'use strict';

  var audioIndex = null; // localStorage에서 로드됨

  /**
   * localStorage에서 오디오 인덱스 초기화
   * @returns {boolean} - 초기화 성공 여부
   */
  function initialize() {
    // audioIndexManager가 있으면 localStorage에서 로드
    if (ChaoOPIc.core.audioIndexManager) {
      audioIndex = ChaoOPIc.core.audioIndexManager.loadFromStorage();
      if (audioIndex) {
        console.log('[fileScanner] Audio index loaded from localStorage');
        return true;
      }
    }

    // 폴백: ChaoOPIc.data.audioFileIndex 사용 (하위 호환성)
    if (ChaoOPIc.data && ChaoOPIc.data.audioFileIndex) {
      audioIndex = ChaoOPIc.data.audioFileIndex;
      console.log('[fileScanner] Audio index loaded from audioFileIndex.js (fallback)');
      return true;
    }

    console.error('[fileScanner] No audio index found. Please set up audio files in audio-manager.html');
    return false;
  }

  /**
   * 카테고리와 토픽명으로 오디오 파일 목록 조회
   * @param {string} category - 'self-introduction', 'selfAssess', 'survey', 'non-survey', 'rolePlay'
   * @param {string} [topicName] - 토픽 폴더명 (category가 survey, non-survey, rolePlay인 경우 필수)
   * @returns {Array<string>} - 오디오 파일 경로 배열
   */
  function getFilesByTopic(category, topicName) {
    if (!audioIndex) {
      console.error('[fileScanner] audioFileIndex not found');
      return [];
    }

    // self-introduction, selfAssess는 topicName 불필요
    if (category === 'self-introduction' || category === 'selfAssess') {
      return audioIndex[category] || [];
    }

    // survey, non-survey, rolePlay는 topicName 필수
    if (!topicName) {
      console.error('[fileScanner] topicName is required for category:', category);
      return [];
    }

    var categoryData = audioIndex[category];
    if (!categoryData || !categoryData[topicName]) {
      console.warn('[fileScanner] No files found for category:', category, 'topic:', topicName);
      return [];
    }

    return categoryData[topicName] || [];
  }

  /**
   * 특정 카테고리의 모든 토픽명 목록 조회
   * @param {string} category - 'survey', 'non-survey', 'rolePlay'
   * @returns {Array<string>} - 토픽명 배열
   */
  function getAllTopics(category) {
    if (!audioIndex || !audioIndex[category]) {
      return [];
    }

    return Object.keys(audioIndex[category]);
  }

  /**
   * 파일명에서 질문 텍스트 추출
   * @param {string} filepath - 파일 경로
   * @returns {string} - 추출된 질문 텍스트
   */
  function extractTextFromFilename(filepath) {
    var filename = filepath.split('/').pop();

    // 확장자 제거
    filename = filename.replace(/\.(mp3|m4a|wav|wma)$/i, '');

    // 패턴 1: "1. ", "11. " 등의 번호 제거
    filename = filename.replace(/^\d+\.\s*/, '');

    // 패턴 2: "Công nghệ - 1. Câu hỏi ..." 형식 처리
    filename = filename.replace(/^.*?\s*-\s*\d+\.\s*/, '');

    // 패턴 3: "Câu hỏi ", "tts ", "translate_tts " 등 접두어 제거
    filename = filename.replace(/^(Câu hỏi|câu hỏi|tts|translate_tts|translate_)\s*/i, '');

    return filename.trim();
  }

  /**
   * 파일 목록에서 특정 번호가 포함된 파일들 필터링
   * @param {Array<string>} files - 파일 경로 배열
   * @param {number} number - 찾을 번호 (1,2,3,4,5,6,11,12,13)
   * @returns {Array<string>} - 매칭되는 파일 경로 배열
   */
  function getFilesByNumber(files, number) {
    // 패턴: (시작 또는 하이픈 또는 공백) + 번호 + 점
    // 예: "1. tts...", "Bác sĩ - 11.mp3", "something 11.mp3"
    var pattern = new RegExp('(^|[-\\s])' + number + '\\.');
    return files.filter(function(filepath) {
      var filename = filepath.split('/').pop();
      return pattern.test(filename);
    });
  }

  /**
   * 특정 번호의 파일들 중 랜덤으로 하나 선택
   * @param {Array<string>} files - 파일 경로 배열
   * @param {number} number - 문제 번호 (1,2,3,4,5,6,11,12,13)
   * @returns {string|null} - 선택된 파일 경로 또는 null
   */
  function getRandomFileByNumber(files, number) {
    var matched = getFilesByNumber(files, number);
    if (matched.length === 0) {
      console.warn('[fileScanner] No files found for number:', number);
      return null;
    }

    var randomIndex = Math.floor(Math.random() * matched.length);
    var selected = matched[randomIndex];
    console.log('[fileScanner] Selected file for number', number + ':', selected, '(from', matched.length, 'options)');
    return selected;
  }

  /**
   * 파일 경로 목록에서 1,2,3번 문제 추출
   * @param {Array<string>} files - 파일 경로 배열
   * @returns {Object} - {q1: path, q2: path, q3: path}
   */
  function extractQuestions123(files) {
    var result = { q1: null, q2: null, q3: null };

    if (!files || files.length === 0) {
      return result;
    }

    // 파일명에서 번호 추출하여 매칭
    files.forEach(function(filepath) {
      var filename = filepath.split('/').pop();
      var match = filename.match(/^(\d+)/);

      if (match) {
        var num = parseInt(match[1]);
        if (num === 1 && !result.q1) result.q1 = filepath;
        else if (num === 2 && !result.q2) result.q2 = filepath;
        else if (num === 3 && !result.q3) result.q3 = filepath;
      }
    });

    // 매칭 실패 시 순서대로 할당
    if (!result.q1 && files[0]) result.q1 = files[0];
    if (!result.q2 && files[1]) result.q2 = files[1];
    if (!result.q3 && files[2]) result.q3 = files[2];

    return result;
  }

  /**
   * 파일 경로 목록에서 11,12,13번 문제 추출 (rolePlay용)
   * @param {Array<string>} files - 파일 경로 배열
   * @returns {Object} - {q11: path, q12: path, q13: path}
   */
  function extractQuestions111213(files) {
    var result = { q11: null, q12: null, q13: null };

    if (!files || files.length === 0) {
      return result;
    }

    // 파일명에서 번호 추출하여 매칭
    files.forEach(function(filepath) {
      var filename = filepath.split('/').pop();
      var match = filename.match(/^(\d+)/);

      if (match) {
        var num = parseInt(match[1]);
        if (num === 11 && !result.q11) result.q11 = filepath;
        else if (num === 12 && !result.q12) result.q12 = filepath;
        else if (num === 13 && !result.q13) result.q13 = filepath;
      }
    });

    // 매칭 실패 시 순서대로 할당
    if (!result.q11 && files[0]) result.q11 = files[0];
    if (!result.q12 && files[1]) result.q12 = files[1];
    if (!result.q13 && files[2]) result.q13 = files[2];

    return result;
  }

  /**
   * Survey 답변으로 매칭되는 모든 폴더 찾기
   * @param {string} answer - Survey 답변 (예: "영화보기")
   * @returns {Array<string>} - 매칭되는 폴더명 배열 (예: ["영화보기_01", "영화보기_02"])
   */
  function findSurveyFolders(answer) {
    if (!audioIndex || !audioIndex.survey) {
      console.error('[fileScanner] audioIndex.survey not found');
      return [];
    }

    var folders = [];

    // {답변}_XX 패턴 찾기 (예: "영화보기_01", "영화보기_02")
    // 정규식: answer로 시작하고 _숫자2자리로 끝나는 패턴
    var escapedAnswer = answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // 특수문자 이스케이프
    var pattern = new RegExp('^' + escapedAnswer + '_\\d{2}$');

    for (var folderName in audioIndex.survey) {
      if (pattern.test(folderName)) {
        folders.push(folderName);
      }
    }

    if (folders.length === 0) {
      console.warn('[fileScanner] No survey folders found for answer:', answer);
    }

    return folders;
  }

  /**
   * Survey 답변에서 랜덤으로 폴더 하나 선택
   * @param {string} answer - Survey 답변
   * @returns {string|null} - 선택된 폴더명 또는 null
   */
  function getRandomSurveyFolder(answer) {
    var folders = findSurveyFolders(answer);
    if (folders.length === 0) {
      return null;
    }

    var randomIndex = Math.floor(Math.random() * folders.length);
    var selected = folders[randomIndex];

    console.log('[fileScanner] Selected folder for "' + answer + '":', selected, '(from', folders.length, 'options)');
    return selected;
  }

  /**
   * 디버깅용: 전체 인덱스 통계 출력
   */
  function printStats() {
    console.log('=== Audio File Index Stats ===');
    console.log('Self-introduction:', (audioIndex['self-introduction'] || []).length, 'files');
    console.log('Self-assessment:', (audioIndex['selfAssess'] || []).length, 'files');
    console.log('Survey topics:', Object.keys(audioIndex['survey'] || {}).length);
    console.log('Non-survey topics:', Object.keys(audioIndex['non-survey'] || {}).length);
    console.log('RolePlay topics:', Object.keys(audioIndex['rolePlay'] || {}).length);
  }

  // Public API
  return {
    initialize: initialize,
    getFilesByTopic: getFilesByTopic,
    getAllTopics: getAllTopics,
    extractTextFromFilename: extractTextFromFilename,
    extractQuestions123: extractQuestions123,
    extractQuestions111213: extractQuestions111213,
    getFilesByNumber: getFilesByNumber,
    getRandomFileByNumber: getRandomFileByNumber,
    findSurveyFolders: findSurveyFolders,
    getRandomSurveyFolder: getRandomSurveyFolder,
    printStats: printStats
  };
})();
