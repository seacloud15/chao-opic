# 베트남어 OPIc 학습 지원 프로그램 Design Document

> **Summary**: 베트남어 OPIc 시뮬레이션, 주제별 연습, 어휘 학습(SRS) 프로그램 상세 설계
>
> **Project**: ChaoOPIc
> **Author**: Haewoon
> **Date**: 2026-02-10
> **Status**: Draft
> **Planning Doc**: [opic-learning.plan.md](../01-plan/features/opic-learning.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- file:// 프로토콜에서 완전 동작하는 오프라인 학습 프로그램
- 사용자가 데이터 파일/음성 파일만 수정하여 콘텐츠 커스터마이징 가능
- 새 기능 추가 시 기존 코드 수정 최소화 (확장성)
- 공통 함수 재사용으로 중복 코드 방지

### 1.2 Design Principles

- **IIFE + 네임스페이스**: `ChaoOPIc` 단일 네임스페이스로 전역 오염 방지
- **데이터-로직 분리**: `js/data/`(콘텐츠)와 `js/core/`, `js/pages/`(로직) 완전 분리
- **Zero Dependency**: 외부 라이브러리 없음, 모든 리소스 로컬 포함
- **Graceful Degradation**: 음성 파일 누락 시 텍스트로 폴백, JSON 파싱 에러 시 기본값 로드

### 1.3 제약 사항 (file:// 프로토콜)

| 제약 | 원인 | 대응 |
|------|------|------|
| `fetch()` 사용 불가 | CORS 정책 | `<script>` 태그로 JS 파일 로드 |
| ES Module 사용 불가 | CORS 정책 | IIFE 패턴 + `<script>` 순서 로드 |
| Service Worker 불가 | HTTPS 필요 | 해당 없음 (오프라인 앱) |
| 오디오 자동 재생 제한 | 브라우저 정책 | 사용자 클릭 후 재생 |

---

## 2. Architecture

### 2.1 전체 구조

```
┌──────────────────────────────────────────────────────┐
│                    Browser (file://)                  │
├──────────────────────────────────────────────────────┤
│  HTML Pages                                          │
│  ┌─────────┬──────────┬─────────┬──────────────┐    │
│  │  index  │simulation│ topics  │  vocabulary   │    │
│  │  .html  │  .html   │  .html  │    .html      │    │
│  └────┬────┴────┬─────┴────┬────┴──────┬───────┘    │
│       │         │          │           │             │
│  ┌────▼─────────▼──────────▼───────────▼──────┐     │
│  │           js/core/ (공통 모듈)               │     │
│  │  app.js │ storage.js │ audio.js │ timer.js  │     │
│  │  ui.js  │ dataLoader.js                     │     │
│  └────┬──────────────────────────────────┬────┘     │
│       │                                  │           │
│  ┌────▼────────────┐  ┌─────────────────▼──────┐   │
│  │  js/pages/       │  │  js/data/ (사용자 편집) │   │
│  │  simulation.js   │  │  topics/*.js           │   │
│  │  topics.js       │  │  vocabulary/words.js   │   │
│  │  vocabulary.js   │  │  simulation/questions.js│   │
│  └─────────────────┘  └────────────────────────┘   │
│       │                                             │
│  ┌────▼─────────────────────────────────────┐      │
│  │         localStorage                      │      │
│  │  srs (복습주기) │ stats (통계)            │      │
│  └──────────────────────────────────────────┘      │
│                                                     │
│  ┌──────────────────────────────────────────┐      │
│  │  audio/ (음성 파일, 사용자 교체 가능)      │      │
│  └──────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

### 2.2 Script 로드 순서

모든 HTML 페이지에서 아래 순서를 지켜야 함 (의존성 순서):

```html
<!-- 1. 네임스페이스 초기화 -->
<script src="js/core/app.js"></script>

<!-- 2. 공통 유틸리티 -->
<script src="js/core/storage.js"></script>
<script src="js/core/audio.js"></script>
<script src="js/core/timer.js"></script>
<script src="js/core/ui.js"></script>
<script src="js/core/dataLoader.js"></script>

<!-- 3. 데이터 파일 (페이지별로 필요한 것만) -->
<script src="js/data/topics/self-intro.js"></script>
<script src="js/data/topics/hobby.js"></script>
<!-- ... -->

<!-- 4. 페이지별 로직 (마지막) -->
<script src="js/pages/simulation.js"></script>
```

### 2.3 네임스페이스 구조

```javascript
var ChaoOPIc = {
  // 설정
  config: { version, storagePrefix },

  // 공통 모듈
  core: {
    storage: {},    // localStorage 래퍼
    audio: {},      // 오디오 재생/녹음
    timer: {},      // 타이머
    ui: {},         // 공통 UI 헬퍼
    dataLoader: {}  // 데이터 로드/검증
  },

  // 데이터 (js/data/ 파일들이 등록)
  data: {
    topics: {},        // 주제별 학습 데이터
    vocabulary: {},    // 어휘 데이터
    simulation: {}     // 시뮬레이션 데이터
  },

  // 페이지별 로직
  pages: {
    simulation: {},
    topics: {},
    vocabulary: {}
  }
};
```

---

## 3. Data Model

### 3.1 주제별 학습 데이터 (`js/data/topics/*.js`)

```javascript
// js/data/topics/self-intro.js
var ChaoOPIc = ChaoOPIc || {};
ChaoOPIc.data = ChaoOPIc.data || {};
ChaoOPIc.data.topics = ChaoOPIc.data.topics || {};

ChaoOPIc.data.topics["self-intro"] = {
  id: "self-intro",
  title: "자기소개",
  titleVi: "Giới thiệu bản thân",
  icon: "👤",
  questions: [
    {
      id: "si-01",
      text: "Hãy giới thiệu về bản thân bạn.",
      translation: "자기소개를 해주세요.",
      audio: "audio/topics/self-intro/si-01.mp3",
      sampleAnswer: "Xin chào, tôi tên là ...",
      sampleTranslation: "안녕하세요, 제 이름은 ..."
    }
  ]
};
```

**주제 목록 (초기 제공)**:

| ID | 제목 | 파일 |
|----|------|------|
| self-intro | 자기소개 | `self-intro.js` |
| hobby | 취미/여가 | `hobby.js` |
| travel | 여행 | `travel.js` |
| work | 직장/업무 | `work.js` |
| daily | 일상생활 | `daily.js` |
| food | 음식 | `food.js` |
| shopping | 쇼핑 | `shopping.js` |
| technology | 기술/인터넷 | `technology.js` |

### 3.2 어휘 데이터 (`js/data/vocabulary/words.js`)

```javascript
// js/data/vocabulary/words.js
var ChaoOPIc = ChaoOPIc || {};
ChaoOPIc.data = ChaoOPIc.data || {};

ChaoOPIc.data.vocabulary = {
  categories: ["인사", "일상", "직장", "여행", "음식"],
  words: [
    {
      id: "v-001",
      word: "xin chào",
      meaning: "안녕하세요",
      pronunciation: "씬 짜오",
      example: "Xin chào, bạn khỏe không?",
      exampleTranslation: "안녕하세요, 잘 지내세요?",
      category: "인사"
    }
  ]
};
```

### 3.3 시뮬레이션 데이터 (`js/data/simulation/questions.js`)

```javascript
// js/data/simulation/questions.js
var ChaoOPIc = ChaoOPIc || {};
ChaoOPIc.data = ChaoOPIc.data || {};

ChaoOPIc.data.simulation = {
  // Background Survey 선택지
  surveyCategories: [
    { id: "self-intro", label: "자기소개" },
    { id: "hobby", label: "취미/여가" },
    { id: "travel", label: "여행" },
    { id: "work", label: "직장/업무" },
    { id: "daily", label: "일상생활" }
  ],
  difficultyLevels: [
    { id: "IL", label: "Intermediate Low" },
    { id: "IM", label: "Intermediate Mid" },
    { id: "IH", label: "Intermediate High" }
  ],
  // 시뮬레이션 전용 질문 풀
  questions: [
    {
      id: "sim-01",
      category: "self-intro",
      difficulty: "IM",
      text: "Hãy giới thiệu về bản thân bạn.",
      translation: "자기소개를 해주세요.",
      audio: "audio/simulation/sim-01.mp3"
    }
  ],
  // 시험 설정
  settings: {
    totalTimeMinutes: 40,
    questionsPerSession: 12,
    preparationTimeSec: 20
  }
};
```

### 3.4 localStorage 데이터 구조

모든 키는 `chaoopic-` 접두사 사용.

```javascript
// Key: "chaoopic-srs"
// 간격 반복 학습 상태 (어휘 카드별)
{
  "v-001": {
    interval: 1,           // 다음 복습까지 일수 (분 단위일 때는 소수점)
    repetition: 0,         // 연속 성공 횟수
    easeFactor: 2.5,       // SM-2 난이도 계수
    nextReview: 1707580800000,  // 다음 복습 시간 (timestamp)
    lastReview: 1707494400000   // 마지막 복습 시간 (timestamp)
  }
}

// Key: "chaoopic-stats"
// 학습 통계
{
  totalReviewed: 150,      // 전체 복습 횟수
  todayReviewed: 20,       // 오늘 복습 횟수
  todayDate: "2026-02-10", // 오늘 날짜 (날짜 바뀌면 초기화)
  streak: 5                // 연속 학습 일수
}
```

---

## 4. Core Modules 설계

### 4.1 app.js - 네임스페이스 초기화

```javascript
// 전역 네임스페이스 생성
var ChaoOPIc = ChaoOPIc || {};

ChaoOPIc.config = {
  version: "1.0.0",
  storagePrefix: "chaoopic-",
  debug: false
};

ChaoOPIc.core = {};
ChaoOPIc.data = { topics: {}, vocabulary: {}, simulation: {} };
ChaoOPIc.pages = {};
```

### 4.2 storage.js - localStorage 래퍼

```javascript
ChaoOPIc.core.storage = (function() {
  var PREFIX = ChaoOPIc.config.storagePrefix;

  return {
    get: function(key) {
      // localStorage에서 PREFIX+key 조회, JSON.parse 후 반환
      // 파싱 실패 시 null 반환
    },
    set: function(key, value) {
      // JSON.stringify 후 PREFIX+key로 저장
    },
    remove: function(key) {
      // PREFIX+key 삭제
    },
    clear: function() {
      // PREFIX로 시작하는 모든 키 삭제
    }
  };
})();
```

### 4.3 audio.js - 오디오 재생/녹음

```javascript
ChaoOPIc.core.audio = (function() {
  var currentAudio = null;

  return {
    // 오디오 파일 재생 (상대 경로)
    play: function(src, onEnded) {
      // 기존 재생 중지 → new Audio(src) → play()
      // 파일 누락 시 에러 핸들링 (onerror 콜백)
    },
    stop: function() {
      // currentAudio.pause(), currentTime = 0
    },
    isPlaying: function() {},

    // 녹음 기능 (MediaRecorder API)
    recorder: {
      start: function(onDataAvailable) {
        // navigator.mediaDevices.getUserMedia 요청
        // MediaRecorder 생성 및 시작
      },
      stop: function() {
        // MediaRecorder.stop(), Blob 반환
      },
      isSupported: function() {
        // MediaRecorder 지원 여부 확인
      }
    }
  };
})();
```

### 4.4 timer.js - 타이머 유틸

```javascript
ChaoOPIc.core.timer = (function() {
  return {
    /**
     * 타이머 인스턴스 생성
     * @param {Object} options
     * @param {number} options.duration - 총 시간(초)
     * @param {boolean} options.countDown - true: 카운트다운, false: 카운트업
     * @param {function} options.onTick - 매초 콜백 (remainingSec)
     * @param {function} options.onComplete - 완료 콜백
     * @returns {Object} { start, pause, resume, reset, getRemaining }
     */
    create: function(options) {
      var intervalId = null;
      var remaining = options.duration;

      return {
        start: function() {},
        pause: function() {},
        resume: function() {},
        reset: function() {},
        getRemaining: function() {}
      };
    },

    // 초를 "MM:SS" 또는 "HH:MM:SS" 형식으로 변환
    formatTime: function(seconds) {}
  };
})();
```

### 4.5 ui.js - 공통 UI 헬퍼

```javascript
ChaoOPIc.core.ui = (function() {
  return {
    // 네비게이션 바 렌더링 (현재 페이지 하이라이트)
    renderNav: function(currentPage) {},

    // 카드 컴포넌트 생성
    renderCard: function(options) {
      // options: { title, description, icon, link, onClick }
      // <div class="card"> 생성 후 반환
    },

    // 모달 표시/숨기기
    showModal: function(options) {
      // options: { title, content, onClose, buttons }
    },
    hideModal: function() {},

    // 토스트 알림
    showToast: function(message, type) {
      // type: "success" | "error" | "info"
      // 3초 후 자동 사라짐
    },

    // 토글 버튼 (한국어 해석 표시/숨기기 등)
    renderToggle: function(label, initialState, onChange) {},

    // 프로그레스 바
    renderProgress: function(current, total) {},

    // DOM 헬퍼
    $: function(selector) { return document.querySelector(selector); },
    $$: function(selector) { return document.querySelectorAll(selector); },
    createElement: function(tag, attrs, children) {}
  };
})();
```

### 4.6 dataLoader.js - 데이터 검증/로드

```javascript
ChaoOPIc.core.dataLoader = (function() {
  return {
    // 등록된 주제 목록 반환
    getTopicList: function() {
      // ChaoOPIc.data.topics 에서 키 목록 추출
      // 각 주제의 id, title, icon, 질문 수 반환
    },

    // 특정 주제 데이터 반환 (검증 포함)
    getTopic: function(topicId) {
      // ChaoOPIc.data.topics[topicId] 반환
      // 없으면 null + 콘솔 경고
    },

    // 어휘 데이터 반환
    getVocabulary: function(category) {
      // category 필터 적용, 없으면 전체 반환
    },

    // 시뮬레이션 질문 반환 (카테고리/난이도 필터 + 랜덤 셔플)
    getSimulationQuestions: function(categories, difficulty, count) {
      // 선택한 카테고리와 난이도에 맞는 질문 필터링
      // Fisher-Yates 셔플 후 count개 반환
    },

    // 데이터 유효성 검증
    validate: function(data, schema) {
      // 필수 필드 존재 여부 체크
      // 실패 시 기본값 반환
    }
  };
})();
```

---

## 5. 페이지별 상세 설계

### 5.1 메인 페이지 (index.html)

**레이아웃:**
```
┌─────────────────────────────────────────────────┐
│  [Logo] ChaoOPIc        [시뮬레이션] [학습] ... │  ← Nav
├─────────────────────────────────────────────────┤
│                                                 │
│      베트남어 OPIc, 함께 준비해요!               │  ← Hero
│      프로그램 소개 텍스트                        │
│                                                 │
├───────────────┬───────────────┐                 │
│  🎯 오픽      │  📚 주제별     │                 │
│  시뮬레이션   │  연습          │                 │  ← Cards
├───────────────┼───────────────┤                 │
│  📝 어휘      │  ⚙️ 학습 자료  │                 │
│  학습         │  관리          │                 │
└───────────────┴───────────────┘                 │
│                                                 │
│  © 2026 ChaoOPIc                                │  ← Footer
└─────────────────────────────────────────────────┘
```

**User Flow:**
```
index.html → 카드 클릭 → 해당 페이지 이동
                        → "학습 자료 관리" 클릭 → 커스터마이징 가이드 모달
```

### 5.2 시험 시뮬레이션 (simulation.html)

**3단계 흐름:**

```
Step 1: Background Survey         Step 2: 시험 안내           Step 3: 시험 진행
┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│  관심 분야 선택       │    │  시험 안내            │    │  [40:00] 남은 시간    │
│                      │    │                      │    │                      │
│  ☑ 자기소개          │    │  - 총 12문항         │    │  문항 3 / 12          │
│  ☑ 취미/여가         │    │  - 40분 진행         │    │                      │
│  ☐ 여행             │    │  - 준비시간 20초      │    │  🔊 [재생]            │
│  ☑ 직장/업무         │    │                      │    │                      │
│  ☐ 일상생활          │    │                      │    │  "Hãy giới thiệu     │
│                      │    │                      │    │   về bản thân bạn."  │
│  난이도 선택          │    │                      │    │                      │
│  ○ IL  ● IM  ○ IH   │    │                      │    │  🎙️ [녹음 시작]       │
│                      │    │                      │    │                      │
│  [시험 시작 →]        │    │  [시험 시작 →]        │    │  [← 이전] [다음 →]    │
└──────────────────────┘    └──────────────────────┘    └──────────────────────┘
```

**simulation.js 핵심 로직:**

```javascript
ChaoOPIc.pages.simulation = (function() {
  var state = {
    step: "survey",           // "survey" | "guide" | "exam" | "result"
    selectedCategories: [],
    selectedDifficulty: "IM",
    questions: [],            // 셔플된 질문 배열
    currentIndex: 0,
    timer: null,              // 전체 타이머 인스턴스
    recordings: []            // 문항별 녹음 Blob
  };

  return {
    init: function() {},

    // Step 1: Background Survey
    renderSurvey: function() {},
    onSurveySubmit: function() {
      // dataLoader.getSimulationQuestions() 호출
      // state.questions 세팅
    },

    // Step 2: 시험 안내
    renderGuide: function() {},

    // Step 3: 시험 진행
    renderExam: function() {},
    nextQuestion: function() {},
    prevQuestion: function() {},
    onTimerComplete: function() {},

    // Step 4: 결과
    renderResult: function() {}
  };
})();
```

### 5.3 주제별 학습 (topics.html)

**2단계 UI:**

```
Step 1: 주제 선택                  Step 2: 질문 학습
┌──────────────────────┐    ┌──────────────────────────────┐
│  주제별 학습           │    │  ← 주제 목록    자기소개      │
│                      │    │                              │
│  ┌────┐ ┌────┐      │    │  문항 1 / 5                   │
│  │ 👤 │ │ 🎮 │      │    │                              │
│  │자기 │ │취미 │      │    │  🔊 [음성 재생]               │
│  │소개 │ │여가 │      │    │                              │
│  └────┘ └────┘      │    │  ┌────────────────────────┐  │
│  ┌────┐ ┌────┐      │    │  │ Hãy giới thiệu về     │  │
│  │ ✈️ │ │ 💼 │      │    │  │ bản thân bạn.          │  │  ← 스크립트
│  │여행 │ │직장 │      │    │  └────────────────────────┘  │
│  └────┘ └────┘      │    │                              │
│  ┌────┐ ┌────┐      │    │  [한국어 해석 보기 ▼]          │  ← 토글
│  │ 🍜 │ │ 🛒 │      │    │  "자기소개를 해주세요."        │
│  │음식 │ │쇼핑 │      │    │                              │
│  └────┘ └────┘      │    │  🎙️ [답변 녹음] [내 녹음 재생]  │
│                      │    │                              │
│                      │    │  [모범 답변 보기 ▼]            │  ← 토글
│                      │    │                              │
│                      │    │  [← 이전]  [다음 →]           │
└──────────────────────┘    └──────────────────────────────┘
```

**topics.js 핵심 로직:**

```javascript
ChaoOPIc.pages.topics = (function() {
  var state = {
    view: "list",          // "list" | "detail"
    currentTopic: null,
    currentIndex: 0,
    showTranslation: false,
    showSampleAnswer: false
  };

  return {
    init: function() {},

    // 주제 목록 화면
    renderTopicList: function() {
      // dataLoader.getTopicList() 으로 등록된 주제 조회
      // 각 주제를 ui.renderCard()로 렌더링
    },

    // 주제 선택 → 질문 학습 화면
    selectTopic: function(topicId) {
      // dataLoader.getTopic(topicId)
      // state.currentTopic 세팅
    },

    // 질문 상세 렌더링
    renderQuestion: function() {},

    // 음성 재생
    playAudio: function() {
      // core.audio.play(question.audio)
    },

    // 답변 녹음
    startRecording: function() {},
    stopRecording: function() {},
    playRecording: function() {},

    // 해석/모범답변 토글
    toggleTranslation: function() {},
    toggleSampleAnswer: function() {},

    // 이전/다음 질문
    nextQuestion: function() {},
    prevQuestion: function() {}
  };
})();
```

### 5.4 어휘 학습 (vocabulary.html)

**카드 UI:**

```
┌──────────────────────────────┐
│  어휘 학습         오늘: 15/50│  ← 진행 상황
├──────────────────────────────┤
│  카테고리: [전체 ▼]           │  ← 필터
│                              │
│  ┌────────────────────────┐  │
│  │                        │  │
│  │      xin chào          │  │  ← 앞면 (베트남어)
│  │      (씬 짜오)          │  │  ← 발음
│  │                        │  │
│  │   [ 정답 확인 ]         │  │
│  │                        │  │
│  └────────────────────────┘  │
│                              │
│         ▼ 클릭 후 ▼           │
│                              │
│  ┌────────────────────────┐  │
│  │  xin chào              │  │
│  │  안녕하세요              │  │  ← 뒷면 (한국어 뜻)
│  │                        │  │
│  │  예문:                  │  │
│  │  "Xin chào, bạn khỏe   │  │
│  │   không?"               │  │
│  │  "안녕하세요, 잘 지내요?" │  │
│  └────────────────────────┘  │
│                              │
│  ┌──────┬──────┬──────┬────┐│
│  │ 다시 │어려움│ 보통 │쉬움 ││  ← 난이도 선택
│  │ <1분 │<10분 │ <1일 │<4일 ││
│  └──────┴──────┴──────┴────┘│
└──────────────────────────────┘
```

**간격 반복 알고리즘 (SM-2 변형):**

```javascript
ChaoOPIc.pages.vocabulary = (function() {
  // SM-2 변형 간격 반복 알고리즘
  var SRS = {
    // 난이도별 기본 간격 (밀리초)
    INTERVALS: {
      again: 1 * 60 * 1000,           // 1분
      hard:  10 * 60 * 1000,          // 10분
      good:  1 * 24 * 60 * 60 * 1000, // 1일
      easy:  4 * 24 * 60 * 60 * 1000  // 4일
    },

    // quality: "again"(0) | "hard"(1) | "good"(2) | "easy"(3)
    calculate: function(card, quality) {
      var qualityNum = { again: 0, hard: 1, good: 2, easy: 3 }[quality];
      var now = Date.now();

      if (qualityNum < 2) {
        // 오답: 반복 초기화
        return {
          interval: this.INTERVALS[quality],
          repetition: 0,
          easeFactor: Math.max(1.3, card.easeFactor - 0.2),
          nextReview: now + this.INTERVALS[quality],
          lastReview: now
        };
      }

      // 정답: 간격 증가
      var newRep = card.repetition + 1;
      var newEF = card.easeFactor + (0.1 - (3 - qualityNum) * 0.08);
      newEF = Math.max(1.3, newEF);

      var newInterval;
      if (newRep === 1) {
        newInterval = this.INTERVALS[quality];
      } else {
        newInterval = card.interval * newEF;
      }

      return {
        interval: newInterval,
        repetition: newRep,
        easeFactor: newEF,
        nextReview: now + newInterval,
        lastReview: now
      };
    },

    // 새 카드 기본 상태
    createNew: function(wordId) {
      return {
        interval: 0,
        repetition: 0,
        easeFactor: 2.5,
        nextReview: 0,
        lastReview: 0
      };
    }
  };

  var state = {
    cards: [],           // 오늘 학습할 카드 목록
    currentIndex: 0,
    showAnswer: false,
    filter: "all"        // 카테고리 필터
  };

  return {
    init: function() {
      // 1. words.js 데이터 로드
      // 2. localStorage에서 SRS 상태 로드
      // 3. 복습 대상 카드 필터 (nextReview <= now)
      // 4. 새 카드 + 복습 카드 합쳐서 오늘 학습 목록 생성
    },

    // 카드 앞면 표시
    renderCard: function() {},

    // 정답 확인 (뒷면 표시)
    revealAnswer: function() {},

    // 난이도 선택 → SRS 계산 → 다음 카드
    rate: function(quality) {
      // SRS.calculate() 호출
      // storage.set("srs", ...) 저장
      // 통계 업데이트
      // 다음 카드로 이동
    },

    // 통계 렌더링
    renderStats: function() {},

    // 카테고리 필터
    setFilter: function(category) {}
  };
})();
```

---

## 6. 공통 UI 스타일 설계

### 6.1 CSS 변수 (테마)

```css
:root {
  /* Colors */
  --color-primary: #1e40af;
  --color-primary-light: #3b82f6;
  --color-secondary: #059669;
  --color-bg: #f9fafb;
  --color-surface: #ffffff;
  --color-text: #1f2937;
  --color-text-light: #6b7280;
  --color-border: #e5e7eb;
  --color-error: #dc2626;
  --color-success: #16a34a;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 40px;

  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;

  /* Shadow */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.1);
}
```

### 6.2 공통 컴포넌트 CSS 클래스

| 클래스 | 용도 |
|--------|------|
| `.container` | 최대 너비 1024px, 중앙 정렬 |
| `.card` | 카드 컴포넌트 (hover 효과 포함) |
| `.btn`, `.btn-primary`, `.btn-secondary` | 버튼 스타일 |
| `.btn-icon` | 아이콘 버튼 (재생, 녹음 등) |
| `.toggle` | 토글 버튼 (해석 보기 등) |
| `.modal`, `.modal-overlay` | 모달 컴포넌트 |
| `.toast` | 토스트 알림 |
| `.progress-bar` | 프로그레스 바 |
| `.timer-display` | 타이머 표시 (큰 숫자) |
| `.srs-buttons` | SRS 난이도 선택 버튼 그룹 |
| `.nav`, `.nav-item`, `.nav-active` | 네비게이션 |
| `.question-card` | 질문 카드 (스크립트, 해석 영역) |
| `.flip-card` | 어휘 플립 카드 |

### 6.3 반응형 브레이크포인트

```css
/* Mobile: 기본 */
/* Tablet: 768px */
@media (min-width: 768px) { }
/* Desktop: 1024px */
@media (min-width: 1024px) { }
```

---

## 7. 에러 처리

| 상황 | 처리 |
|------|------|
| 데이터 파일 누락 (JS 변수 undefined) | `dataLoader.validate()`에서 감지 → 콘솔 경고 + 빈 목록 표시 |
| 음성 파일 누락 | `audio.play()` onerror → 토스트 "음성 파일을 찾을 수 없습니다" |
| localStorage 가득 참 | `storage.set()` try-catch → 토스트 "저장 공간 부족" |
| 마이크 권한 거부 | `recorder.start()` catch → 토스트 "마이크 권한이 필요합니다" |
| 사용자 데이터 형식 오류 | `validate()` 실패 → 콘솔에 상세 에러 + 기본 데이터로 폴백 |

---

## 8. 구현 순서

| 순서 | 작업 | 의존성 | 예상 파일 |
|------|------|--------|----------|
| 1 | 네임스페이스 + 공통 모듈 (core/) | 없음 | `app.js`, `storage.js`, `ui.js`, `timer.js`, `audio.js`, `dataLoader.js` |
| 2 | CSS 전역 스타일 + 공통 컴포넌트 | 없음 | `style.css` |
| 3 | 샘플 데이터 파일 작성 | 없음 | `js/data/topics/*.js`, `vocabulary/words.js`, `simulation/questions.js` |
| 4 | 메인 페이지 | core, css | `index.html` |
| 5 | 주제별 학습 페이지 | core, data, css | `topics.html`, `topics.js` |
| 6 | 시험 시뮬레이션 페이지 | core, data, css, timer | `simulation.html`, `simulation.js` |
| 7 | 어휘 학습 페이지 (SRS) | core, data, css, storage | `vocabulary.html`, `vocabulary.js` |
| 8 | 통합 테스트 + 다른 PC 배포 테스트 | 전체 | - |

---

## 9. Completion Checklist

- [ ] 모든 페이지 file:// 에서 정상 동작
- [ ] 폴더 복사만으로 다른 PC에서 실행
- [ ] 데이터 파일 수정 시 콘텐츠 반영
- [ ] 음성 파일 교체 시 정상 재생
- [ ] localStorage SRS 데이터 영속
- [ ] 모바일 반응형 (768px 이하)
- [ ] 에러 상황에서 graceful degradation

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-10 | Initial design document | Haewoon |
