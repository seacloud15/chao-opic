/**
 * ChaoOPIc - File Scanner Module
 * audioFileIndex를 사용하여 파일 조회
 *
 * IIFE 패턴, ChaoOPIc.core.fileScanner 네임스페이스
 */
ChaoOPIc.core.fileScanner = (function() {
  'use strict';

  var audioIndex = ChaoOPIc.data.audioFileIndex;

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
    getFilesByTopic: getFilesByTopic,
    getAllTopics: getAllTopics,
    extractTextFromFilename: extractTextFromFilename,
    extractQuestions123: extractQuestions123,
    extractQuestions111213: extractQuestions111213,
    printStats: printStats
  };
})();
