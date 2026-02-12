# 문제 제출 페이지 개발 - 구현 로직 계획

## 개요
Survey 응답 기반 동적 문제 선택 및 출제 로직 구현

## 현재 상황 분석

### audio/simulation 폴더 구조
```
audio/simulation/
├── self-introduction/         # 자기소개 (1번)
│   └── 1.question.mp3
├── survey/                    # 설문 선택 항목 (Topic 1, 2용)
│   ├── 00. 독신거주/
│   ├── 01. 공원가기/
│   ├── 02. 해변가기/
│   ├── 03. 음악감상하기/
│   ├── ...
│   └── [각 폴더 내 1, 2, 3으로 시작하는 파일]
├── non-survey/                # 비설문 항목 (Topic 3, 4용)
│   ├── CÔNG NGHỆ/
│   ├── CUỘC HẸN/
│   ├── ĐỊA LÝ/
│   ├── ...
│   └── [각 폴더 내 1, 2, 3으로 시작하는 파일]
├── rolePlay/                  # 롤플레이 (11,12,13번)
│   ├── Ăn lễ/
│   ├── Bác sĩ/
│   ├── ...
│   └── [각 폴더 내 11, 12, 13으로 시작하는 파일]
└── selfAssess/                # Self Assessment 레벨 샘플 오디오
    ├── 0.mp3
    ├── 1.mp3
    ├── ...
    └── 5.mp3
```

### 문제 구성 규칙
| 문항 번호 | 카테고리 | 선택 규칙 | 파일 패턴 |
|---------|---------|----------|---------|
| 1 | self-introduction | 고정 | self-introduction/1.question.mp3 |
| 2,3,4 | Topic 1 (survey) | survey 선택 항목 중 랜덤 1개 | survey/[토픽명]/1*.*, 2*.*, 3*.* |
| 5,6,7 | Topic 2 (survey) | survey 선택 항목 중 랜덤 1개 (Topic 1과 중복 제외) | survey/[토픽명]/1*.*, 2*.*, 3*.* |
| 8,9,10 | Topic 3 (non-survey) | non-survey 항목 중 랜덤 1개 | non-survey/[토픽명]/1*.*, 2*.*, 3*.* |
| 11,12,13 | rolePlay | rolePlay 항목 중 랜덤 1개 | rolePlay/[토픽명]/11*.*, 12*.*, 13*.* |
| 14,15 | Topic 4 (non-survey) | non-survey 항목 중 랜덤 1개 (Topic 3과 중복 제외) | non-survey/[토픽명]/1*.*, 2*.*, 3*.* |

## 구현 단계

### 1단계: 데이터 구조 설계

#### 1.1 Topic 매핑 데이터 생성
`js/data/simulation/topicMapping.js` 생성

```javascript
var ChaoOPIc = ChaoOPIc || {};
ChaoOPIc.data = ChaoOPIc.data || {};

ChaoOPIc.data.topicMapping = {
  // Survey 응답 → audio 폴더명 매핑
  surveyTopicMap: {
    '영화보기': 'XEM PHIM',
    '공연보기': '05. 공연보기',
    '콘서트보기': '04. 콘서트보기',
    '공원가기': 'ĐI CÔNG VIÊN',
    '해변가기': 'ĐI BIỂN',
    '음악 감상하기': 'NGHE NHẠC',
    '조깅': '07. 조깅',
    '걷기': 'ĐI BỘ- CHẠY BỘ',
    '국내 여행': 'DU LỊCH TRONG NƯỚC',
    '해외 여행': 'DU LỊCH NƯỚC NGOÀI',
    '집에서 보내는 휴가': 'Ở NHÀ VÀO KỲ NGHỈ',
    '개인주택이나 아파트에 홀로 거주': '00. 독신거주',
    // ... 추가 매핑
  },

  // non-survey 항목 폴더명 목록
  nonSurveyTopics: [
    'CÔNG NGHỆ',
    'CUỘC HẸN',
    'ĐỊA LÝ',
    'Điện thoại',
    'GIA ĐÌNH',
    'NGÂN HÀNG',
    'NGÀY LỄ',
    'NHÀ HÀNG',
    'NHÀ Ở',
    'NỘI THẤT',
    'THỜI GIAN RẢNH',
    'THỜI TIẾT',
    'THỜI TRANG',
    '명절 띠엔 (02.03)',
    '약속 (띠엔 25.01.26)',
    '은행 (띠엔 25.01.26)'
  ],

  // rolePlay 항목 폴더명 목록
  rolePlayTopics: [
    'Ăn lễ',
    'Bác sĩ',
    'CH quần áo',
    'Công viên',
    'Cty du lịch',
    'Điện thoại',
    'Ga tàu',
    'Internet',
    'Khách sạn 01',
    'Khách sạn 02',
    'Khách sạn 03',
    'Khách sạn 04',
    'Loa',
    'Mua sắm 01',
    'Mua sắm 02',
    'Ngân hàng 01',
    'Ngân hàng 02',
    'Nhà hàng',
    'Nhà họ hàng',
    'Nội thất',
    'Phòng quản lý',
    'RP 스피커 (띠엔 25.01.26)',
    'RP 여행 (띠엔 25.01.26)',
    'Thuê xe',
    'Tiệc sinh nhật',
    'Tụ tập',
    'Xem biểu diễn',
    'Xem phim',
    '영화 RP (띠엔, 25.01.08)'
  ]
};
```

#### 1.2 파일 스캔 유틸 개발
`js/core/fileScanner.js` 생성 (IIFE 패턴)

```javascript
ChaoOPIc.core.fileScanner = (function() {
  // file:// 프로토콜에서 파일 목록 가져올 수 없으므로
  // 하드코딩된 파일 목록 사용 (사용자가 audio 폴더 교체 시 이 파일 재생성)

  var audioFiles = {
    'self-introduction': [
      'audio/simulation/self-introduction/1.question.mp3'
    ],
    'survey': {
      'XEM PHIM': [
        'audio/simulation/survey/06. 영화보기/1. tts 좋아하는 영화 및 장르.mp3',
        'audio/simulation/survey/06. 영화보기/2. tts 최근 영화 본 하루에 대해.mp3',
        'audio/simulation/survey/06. 영화보기/3. tts 좋아하는 배우에 대해.mp3'
      ],
      // ... 각 survey topic별 파일 목록
    },
    'non-survey': {
      'CÔNG NGHỆ': [
        'audio/simulation/non-survey/CÔNG NGHỆ/Công nghệ - 1. Câu hỏi 당신 나라 사람들이 보통 사용하는 기술 장비.m4a',
        'audio/simulation/non-survey/CÔNG NGHỆ/Công nghệ - 2. Câu hỏi 매일 사용하는 기술 장비에 대해 설명.m4a',
        'audio/simulation/non-survey/CÔNG NGHỆ/Công nghệ - 3. Câu hỏi 새로운 기술을 사용 할 때 생기는 문제 경험.m4a'
      ],
      // ... 각 non-survey topic별 파일 목록
    },
    'rolePlay': {
      'Ăn lễ': [
        'audio/simulation/rolePlay/Ăn lễ/Ăn lễ - 11.wav',
        'audio/simulation/rolePlay/Ăn lễ/Ăn lễ - 12.wav',
        'audio/simulation/rolePlay/Ăn lễ/Ăn lễ - 13.wav'
      ],
      // ... 각 rolePlay topic별 파일 목록
    }
  };

  return {
    getFilesByTopic: function(category, topicName) {
      // category: 'survey', 'non-survey', 'rolePlay'
      if (category === 'self-introduction') {
        return audioFiles['self-introduction'];
      }
      return audioFiles[category][topicName] || [];
    },

    getAllTopics: function(category) {
      return Object.keys(audioFiles[category] || {});
    }
  };
})();
```

### 2단계: 문제 선택 로직 구현

#### 2.1 QuestionSelector 모듈 개발
`js/core/questionSelector.js` 생성

```javascript
ChaoOPIc.core.questionSelector = (function() {
  var topicMapping = ChaoOPIc.data.topicMapping;
  var fileScanner = ChaoOPIc.core.fileScanner;

  // Fisher-Yates shuffle
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

  // Survey 응답에서 선택 가능한 토픽 추출
  function extractSurveyTopics(surveyAnswers) {
    var part4 = surveyAnswers.part4 || [];
    var surveyTopics = [];

    part4.forEach(function(answer) {
      var folderName = topicMapping.surveyTopicMap[answer];
      if (folderName) {
        surveyTopics.push(folderName);
      }
    });

    return surveyTopics;
  }

  // 문제 세트 생성
  function generateQuestionSet(surveyAnswers) {
    var questions = [];

    // 1번: self-introduction (고정)
    var selfIntro = fileScanner.getFilesByTopic('self-introduction')[0];
    questions.push({
      id: 'q1',
      number: 1,
      category: 'self-introduction',
      audio: selfIntro,
      text: 'Hãy giới thiệu về bản thân bạn.',
      translation: '자기소개를 해주세요.'
    });

    // Survey 토픽 목록 추출
    var surveyTopics = extractSurveyTopics(surveyAnswers);
    var shuffledSurvey = shuffle(surveyTopics);

    // 2,3,4번: Topic 1 (survey 중 1개)
    if (shuffledSurvey.length > 0) {
      var topic1 = shuffledSurvey[0];
      var topic1Files = fileScanner.getFilesByTopic('survey', topic1);
      for (var i = 0; i < 3 && i < topic1Files.length; i++) {
        questions.push({
          id: 'q' + (2 + i),
          number: 2 + i,
          category: 'survey',
          topic: topic1,
          audio: topic1Files[i],
          text: extractTextFromFilename(topic1Files[i]),
          translation: ''
        });
      }
    }

    // 5,6,7번: Topic 2 (survey 중 1개, Topic 1 제외)
    if (shuffledSurvey.length > 1) {
      var topic2 = shuffledSurvey[1];
      var topic2Files = fileScanner.getFilesByTopic('survey', topic2);
      for (var i = 0; i < 3 && i < topic2Files.length; i++) {
        questions.push({
          id: 'q' + (5 + i),
          number: 5 + i,
          category: 'survey',
          topic: topic2,
          audio: topic2Files[i],
          text: extractTextFromFilename(topic2Files[i]),
          translation: ''
        });
      }
    }

    // Non-survey 토픽 랜덤 선택
    var nonSurveyTopics = shuffle(topicMapping.nonSurveyTopics);

    // 8,9,10번: Topic 3 (non-survey 중 1개)
    if (nonSurveyTopics.length > 0) {
      var topic3 = nonSurveyTopics[0];
      var topic3Files = fileScanner.getFilesByTopic('non-survey', topic3);
      for (var i = 0; i < 3 && i < topic3Files.length; i++) {
        questions.push({
          id: 'q' + (8 + i),
          number: 8 + i,
          category: 'non-survey',
          topic: topic3,
          audio: topic3Files[i],
          text: extractTextFromFilename(topic3Files[i]),
          translation: ''
        });
      }
    }

    // 11,12,13번: rolePlay (랜덤 1개)
    var rolePlayTopics = shuffle(topicMapping.rolePlayTopics);
    if (rolePlayTopics.length > 0) {
      var rpTopic = rolePlayTopics[0];
      var rpFiles = fileScanner.getFilesByTopic('rolePlay', rpTopic);
      for (var i = 0; i < 3 && i < rpFiles.length; i++) {
        questions.push({
          id: 'q' + (11 + i),
          number: 11 + i,
          category: 'rolePlay',
          topic: rpTopic,
          audio: rpFiles[i],
          text: extractTextFromFilename(rpFiles[i]),
          translation: ''
        });
      }
    }

    // 14,15번: Topic 4 (non-survey 중 1개, Topic 3 제외)
    if (nonSurveyTopics.length > 1) {
      var topic4 = nonSurveyTopics[1];
      var topic4Files = fileScanner.getFilesByTopic('non-survey', topic4);
      // 14,15번은 첫 2개만
      for (var i = 0; i < 2 && i < topic4Files.length; i++) {
        questions.push({
          id: 'q' + (14 + i),
          number: 14 + i,
          category: 'non-survey',
          topic: topic4,
          audio: topic4Files[i],
          text: extractTextFromFilename(topic4Files[i]),
          translation: ''
        });
      }
    }

    return questions;
  }

  // 파일명에서 질문 텍스트 추출 (간단 구현)
  function extractTextFromFilename(filepath) {
    var filename = filepath.split('/').pop();
    // 확장자 제거
    filename = filename.replace(/\.(mp3|m4a|wav|wma)$/i, '');
    // 번호 제거 (예: "1. ", "11. ", "Công nghệ - 1. ")
    filename = filename.replace(/^.*?\d+\.\s*/, '');
    return filename;
  }

  return {
    generate: generateQuestionSet
  };
})();
```

### 3단계: simulation.js 통합

#### 3.1 startExam() 함수 수정
기존:
```javascript
function startExam() {
  var allQ = sim.questions.slice();
  // Fisher-Yates shuffle
  for (var i = allQ.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = allQ[i]; allQ[i] = allQ[j]; allQ[j] = tmp;
  }
  state.questions = allQ.slice(0, sim.settings.questionsPerSession);
  // ...
}
```

수정 후:
```javascript
function startExam() {
  // Survey 응답 기반 문제 생성
  var questionSelector = ChaoOPIc.core.questionSelector;
  state.questions = questionSelector.generate(state.surveyAnswers);

  state.recordings = new Array(state.questions.length);
  state.currentIndex = 0;
  state.replayUsed = {};
  state.examPhase = 'testing';

  // Timer (문제 개수는 15개 고정)
  state.examTimer = timer.create({
    duration: sim.settings.totalTimeMinutes * 60,
    // ...
  });
  state.examTimer.start();

  renderExamTesting();
}
```

### 4단계: 파일 목록 하드코딩 생성

#### 4.1 audioFileIndex.js 생성 스크립트 (Node.js, 개발용)
개발 시 audio 폴더 스캔하여 `js/data/simulation/audioFileIndex.js` 자동 생성

```javascript
// scripts/generateAudioIndex.js (개발용, 배포 전 실행)
const fs = require('fs');
const path = require('path');

const audioRoot = './audio/simulation';
const output = './js/data/simulation/audioFileIndex.js';

function scanDir(dir) {
  const result = {};
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result[entry.name] = scanDir(fullPath);
    } else if (/\.(mp3|m4a|wav|wma)$/i.test(entry.name)) {
      if (!result.files) result.files = [];
      result.files.push(fullPath.replace(/\\/g, '/'));
    }
  }

  return result;
}

const index = scanDir(audioRoot);

const template = `var ChaoOPIc = ChaoOPIc || {};
ChaoOPIc.data = ChaoOPIc.data || {};

ChaoOPIc.data.audioFileIndex = ${JSON.stringify(index, null, 2)};
`;

fs.writeFileSync(output, template, 'utf-8');
console.log('✓ Audio file index generated:', output);
```

#### 4.2 HTML에 스크립트 추가
`simulation.html`:
```html
<!-- Data -->
<script src="js/data/simulation/topicMapping.js"></script>
<script src="js/data/simulation/audioFileIndex.js"></script>
<script src="js/data/simulation/questions.js"></script>
<!-- Core -->
<script src="js/core/fileScanner.js"></script>
<script src="js/core/questionSelector.js"></script>
```

## 테스트 시나리오

### 시나리오 1: Survey 선택 항목 2개
1. Part 4에서 '영화보기', '공원가기' 선택
2. 시험 시작 시:
   - 2,3,4번: '영화보기' 또는 '공원가기' 중 1개
   - 5,6,7번: 나머지 1개
   - 8,9,10번: non-survey 중 랜덤
   - 14,15번: non-survey 중 랜덤 (8,9,10번과 다른 토픽)

### 시나리오 2: Survey 선택 항목 12개 이상
1. Part 4에서 12개 이상 선택
2. 시험 시작 시:
   - 2,3,4번, 5,6,7번: 12개 중 랜덤 2개 선택
   - 8,9,10번, 14,15번: non-survey 중 랜덤 2개 선택

## 제약사항 대응

### file:// 프로토콜 제약
- 동적 파일 스캔 불가 → 하드코딩된 파일 인덱스 사용
- 사용자가 audio 폴더 교체 시:
  1. `scripts/generateAudioIndex.js` 실행 (Node.js)
  2. `js/data/simulation/audioFileIndex.js` 재생성
  3. 폴더 복사 배포

### 베트남어 파일명 인코딩
- UTF-8 인코딩 유지
- 파일명에서 질문 텍스트 추출 시 유니코드 문자 처리

## 향후 개선 사항
1. 질문 텍스트 번역 데이터 추가 (베트남어 → 한국어)
2. Self Assessment 레벨에 따른 난이도 조절
3. 문제 카테고리별 통계 및 피드백
4. 오디오 파일 preload 최적화

## 파일 체크리스트
- [ ] `js/data/simulation/topicMapping.js` 생성
- [ ] `js/data/simulation/audioFileIndex.js` 생성 (스크립트 실행)
- [ ] `js/core/fileScanner.js` 생성
- [ ] `js/core/questionSelector.js` 생성
- [ ] `js/pages/simulation.js` 수정 (startExam 함수)
- [ ] `simulation.html` 수정 (script 태그 추가)
- [ ] `scripts/generateAudioIndex.js` 생성 (개발용)

## 예상 작업 시간
- 데이터 구조 설계: 1시간
- 파일 스캔 유틸 개발: 1시간
- 문제 선택 로직 구현: 2시간
- 통합 및 테스트: 2시간
- **총 예상: 6시간**
