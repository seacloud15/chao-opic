/**
 * ChaoOPIc - Question Selector Module
 * Survey 응답 기반 문제 세트 생성
 *
 * 문제 구성:
 * - 1번: self-introduction (고정)
 * - 2,3,4번: Survey Topic 1
 * - 5,6,7번: Survey Topic 2
 * - 8,9,10번: Survey Topic 3
 * - 11,12,13번: RolePlay
 * - 14,15번: Issue Comparison
 *
 * IIFE 패턴, ChaoOPIc.core.questionSelector 네임스페이스
 */
ChaoOPIc.core.questionSelector = (function() {
  'use strict';

  var fileScanner = ChaoOPIc.core.fileScanner;

  /**
   * Fisher-Yates shuffle 알고리즘
   * @param {Array} arr - 셔플할 배열
   * @returns {Array} - 셔플된 새 배열
   */
  function shuffle(arr) {
    var result = arr.slice();
    for (var i = result.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = result[i];
      result[i] = result[j];
      result[j] = tmp;
    }
    return result;
  }

  /**
   * Survey 응답에서 선택 가능한 survey 토픽 폴더명 추출
   * @param {Object} surveyAnswers - { part1: ..., part2: ..., part3: ..., part4: [...] }
   * @returns {Array<string>} - survey 폴더명 목록
   */
  function extractSurveyTopics(surveyAnswers) {
    var surveyFolders = [];

    // Part 3: 거주 형태
    var part3Answer = surveyAnswers.part3;
    if (part3Answer) {
      var folder = fileScanner.getRandomSurveyFolder(part3Answer);
      if (folder) {
        surveyFolders.push(folder);
      }
    }

    // Part 4: 여가/취미/운동/휴가 (배열)
    var part4Answers = surveyAnswers.part4 || [];
    part4Answers.forEach(function(answer) {
      var folder = fileScanner.getRandomSurveyFolder(answer);
      if (folder) {
        surveyFolders.push(folder);
      }
    });

    // 중복 제거 (이미 랜덤 선택되므로 중복 가능성 낮지만 안전장치)
    var unique = [];
    surveyFolders.forEach(function(folder) {
      if (unique.indexOf(folder) === -1) {
        unique.push(folder);
      }
    });

    return unique;
  }

  /**
   * 단일 토픽에서 문제 생성 (동적 파일 번호 선택)
   * @param {string} category - 'survey', 'non-survey'
   * @param {string} topicName - 토픽 폴더명
   * @param {number} startNumber - 문제 시작 번호 (2, 5, 8, 14)
   * @param {number} count - 문제 개수 (3 또는 2)
   * @param {number} selfAssessLevel - Self Assessment 레벨 (1-6)
   * @returns {Array<Object>} - 문제 객체 배열
   */
  function generateTopicQuestions(category, topicName, startNumber, count, selfAssessLevel) {
    var questions = [];
    var files = fileScanner.getFilesByTopic(category, topicName);

    if (!files || files.length === 0) {
      console.warn('[questionSelector] No files found for', category, topicName);
      return questions;
    }

    for (var i = 0; i < count; i++) {
      var questionNumber = startNumber + i;
      var fileNumber;

      // 문항 번호에 따른 파일 번호 매핑
      if (questionNumber >= 2 && questionNumber <= 13) {
        // Q2-Q13: 1,2,3번 파일 순환
        fileNumber = ((questionNumber - 2) % 3) + 1;
      } else if (questionNumber === 14) {
        // Q14: 4번 파일
        fileNumber = 4;
      } else if (questionNumber === 15) {
        // Q15: 난이도에 따라 5 또는 6번 파일
        fileNumber = (selfAssessLevel <= 4) ? 6 : 5;
      }

      var filepath = fileScanner.getRandomFileByNumber(files, fileNumber);

      if (filepath) {
        questions.push({
          id: 'q' + questionNumber,
          number: questionNumber,
          category: category,
          topic: topicName,
          audio: filepath,
          text: fileScanner.extractTextFromFilename(filepath),
          translation: ''
        });
      } else {
        console.warn('[questionSelector] No file found for number', fileNumber, 'in', topicName);
      }
    }

    return questions;
  }

  /**
   * RolePlay 3개 문제 생성 (11,12,13번 파일 사용)
   * @param {string} topicName - 롤플레이 토픽 폴더명
   * @returns {Array<Object>} - 문제 객체 배열
   */
  function generateRolePlayQuestions(topicName) {
    var questions = [];
    var files = fileScanner.getFilesByTopic('rolePlay', topicName);

    if (!files || files.length === 0) {
      console.warn('[questionSelector] No rolePlay files found for', topicName);
      return questions;
    }

    // Q11, Q12, Q13: 각각 11, 12, 13번 파일 중 랜덤 선택
    for (var i = 11; i <= 13; i++) {
      var filepath = fileScanner.getRandomFileByNumber(files, i);
      if (filepath) {
        questions.push({
          id: 'q' + i,
          number: i,
          category: 'rolePlay',
          topic: topicName,
          audio: filepath,
          text: fileScanner.extractTextFromFilename(filepath),
          translation: ''
        });
      } else {
        console.warn('[questionSelector] No file found for number', i, 'in rolePlay', topicName);
      }
    }

    return questions;
  }

  /**
   * Survey 응답 기반 문제 세트 생성 (15개)
   * @param {Object} surveyAnswers - Survey 응답 객체
   * @param {number} selfAssessLevel - Self Assessment 레벨 (1-6)
   * @returns {Array<Object>} - 15개 문제 배열
   */
  function generateQuestionSet(surveyAnswers, selfAssessLevel) {
    var questions = [];

    console.log('[questionSelector] Generating question set...');
    console.log('Survey answers:', surveyAnswers);
    console.log('Self Assessment Level:', selfAssessLevel);

    // === 1번: self-introduction (고정) ===
    var selfIntroFiles = fileScanner.getFilesByTopic('self-introduction');
    if (selfIntroFiles.length > 0) {
      questions.push({
        id: 'q1',
        number: 1,
        category: 'self-introduction',
        topic: 'self-introduction',
        audio: selfIntroFiles[0],
        text: 'Hãy giới thiệu về bản thân bạn.',
        translation: '자기소개를 해주세요.'
      });
    } else {
      console.error('[questionSelector] Self-introduction file not found!');
    }

    // === Survey 토픽 추출 및 셔플 ===
    var surveyTopics = extractSurveyTopics(surveyAnswers);
    console.log('Survey topics found:', surveyTopics.length, surveyTopics);

    var shuffledSurvey = shuffle(surveyTopics);

    // === 2,3,4번: Survey Topic 1 ===
    if (shuffledSurvey.length > 0) {
      var topic1 = shuffledSurvey[0];
      console.log('Topic 1 (Q2-4):', topic1);
      var topic1Questions = generateTopicQuestions('survey', topic1, 2, 3, selfAssessLevel);
      questions = questions.concat(topic1Questions);
    } else {
      console.warn('[questionSelector] No survey topics available for Q2-4');
    }

    // === 5,6,7번: Survey Topic 2 ===
    if (shuffledSurvey.length > 1) {
      var topic2 = shuffledSurvey[1];
      console.log('Topic 2 (Q5-7):', topic2);
      var topic2Questions = generateTopicQuestions('survey', topic2, 5, 3, selfAssessLevel);
      questions = questions.concat(topic2Questions);
    } else {
      console.warn('[questionSelector] No second survey topic available for Q5-7');
    }

    // === 8,9,10번: Survey Topic 3 ===
    if (shuffledSurvey.length > 2) {
      var topic3 = shuffledSurvey[2];
      console.log('Topic 3 (Q8-10):', topic3);
      var topic3Questions = generateTopicQuestions('survey', topic3, 8, 3, selfAssessLevel);
      questions = questions.concat(topic3Questions);
    } else {
      console.warn('[questionSelector] No third survey topic available for Q8-10');
    }

    // === 11,12,13번: RolePlay ===
    var rolePlayTopics = shuffle(fileScanner.getAllTopics('rolePlay'));
    console.log('RolePlay topics available:', rolePlayTopics.length);

    if (rolePlayTopics.length > 0) {
      var rpTopic = rolePlayTopics[0];
      console.log('RolePlay topic (Q11-13):', rpTopic);
      var rpQuestions = generateRolePlayQuestions(rpTopic);
      questions = questions.concat(rpQuestions);
    } else {
      console.warn('[questionSelector] No rolePlay topics available for Q11-13');
    }

    // === 14,15번: Issue Comparison ===
    var issueCompTopics = shuffle(fileScanner.getAllTopics('issueComparison'));
    console.log('Issue Comparison topics available:', issueCompTopics.length);

    if (issueCompTopics.length > 0) {
      var topic4 = issueCompTopics[0];
      console.log('Topic 4 (Q14-15):', topic4);
      var topic4Questions = generateTopicQuestions('issueComparison', topic4, 14, 2, selfAssessLevel);
      questions = questions.concat(topic4Questions);
    } else {
      console.warn('[questionSelector] No issueComparison topics available for Q14-15');
    }

    console.log('[questionSelector] Generated', questions.length, 'questions');

    // 문제 개수 검증
    if (questions.length < 15) {
      console.warn('[questionSelector] Generated less than 15 questions:', questions.length);
    }

    return questions;
  }

  /**
   * 디버깅용: 생성된 문제 세트 요약 출력
   * @param {Array<Object>} questions - 문제 배열
   */
  function printQuestionSummary(questions) {
    console.log('\n=== Question Set Summary ===');
    questions.forEach(function(q) {
      console.log(q.number + '.', '[' + q.category + ']', q.topic, '-', q.text.substring(0, 50) + '...');
    });
    console.log('===========================\n');
  }

  // Public API
  return {
    generate: generateQuestionSet,
    printSummary: printQuestionSummary
  };
})();
