# 베트남어 OPIc 학습 지원 프로그램 Planning Document

> **Summary**: 부서원들의 베트남어 OPIc 등급 취득을 위한 시험 시뮬레이션 및 학습 보조 프로그램
>
> **Project**: ChaoOPIc
> **Author**: Haewoon
> **Date**: 2026-02-10
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

부서원들이 베트남어 OPIc 시험을 효율적으로 준비할 수 있도록, 시험 형식에 맞춘 시뮬레이션 환경과 주제별 학습 자료를 제공하는 웹 프로그램을 개발한다.

### 1.2 Background

- 부서원들의 베트남어 OPIc 등급 취득 필요성 증가
- 체계적인 학습 도구 부재로 개별 학습에 어려움
- 실제 시험 환경에 가까운 연습 기회 필요
- **보안 사업장 환경**: 외부 드라이브, git, 인터넷 사용 불가 → 폴더 복사만으로 배포 가능해야 함

### 1.3 Related Documents

- OPIc 시험 공식 가이드 (ACTFL)
- OPIc 등급 체계: NL → NM → NH → IL → IM → IH → AL → AM → AH

---

## 2. Scope

### 2.1 In Scope

- [ ] 시험 시뮬레이션 (타이머 + 질문 출제 + 답변 녹음/연습)
- [ ] 주제별 연습, 문제 듣기 및 답변 녹음/연습 (자기소개, 일상생활, 취미, 여행, 직장 등)
- [ ] 사용자가 자유롭게 학습 자료를 관리할 수 있도록 함 (JSON 파일 + 음성 파일 교체)
- [ ] 핵심 어휘 암기 학습 페이지 제공 (간격 반복 학습)
- [ ] localStorage를 활용한 학습 진도 및 복습 주기 저장

### 2.2 Out of Scope

- Node.js 등 서버 사이드 프레임워크 사용 (순수 HTML/CSS/JS만 사용)
- 실시간 발음 평가 (AI 연동)
- 사용자 로그인/회원가입 (서버 없음)
- CDN 등 외부 네트워크 리소스 의존

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 메인 페이지: 프로그램 소개 및 4가지 기능 카드 네비게이션 | High | Pending |
| FR-02 | 시험 시뮬레이션: OPIc 형식 모의 시험 (Background Survey → 질문 출제 → 40분 타이머) | High | Pending |
| FR-03 | 주제별 학습: 음성 듣기 + 답변 녹음 + 스크립트/한국어 해석 제공 | High | Pending |
| FR-04 | 어휘 학습: JSON 기반 단어 리스트 + AnkiDroid식 간격 반복 학습 | Medium | Pending |
| FR-05 | 학습 자료 관리: 사용자가 JSON/음성 파일을 직접 수정하여 콘텐츠 커스터마이징 | High | Pending |
| FR-06 | 모바일 반응형: 768px 이하 모바일 최적화 | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Portability | 폴더 복사만으로 어느 PC에서나 실행 | 다른 PC에서 실행 테스트 |
| Performance | 페이지 로딩 < 2초 | 브라우저 DevTools |
| Extensibility | 새 기능 추가 시 기존 코드 수정 최소화 | 코드 리뷰 |
| Reusability | 공통 함수 재사용률 높음, 중복 함수 최소화 | 코드 리뷰 |
| Compatibility | Chrome, Edge, Safari, Mobile 브라우저 | 크로스 브라우저 테스트 |
| Offline | 인터넷 없이 완전 동작 (외부 CDN 없음) | 오프라인 실행 테스트 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 모든 기능 요구사항 (FR-01 ~ FR-06) 구현 완료
- [ ] 모든 페이지 모바일 반응형 동작 확인
- [ ] 폴더 복사만으로 다른 PC에서 정상 실행 확인
- [ ] 사용자가 data/ 폴더 내 JSON/음성 파일 수정 시 학습 내용 반영 확인

### 4.2 Quality Criteria

- [ ] HTML Validation 통과 (W3C Validator)
- [ ] 외부 CDN/네트워크 의존성 제로
- [ ] 모든 페이지 간 네비게이션 정상 작동
- [ ] 공통 함수가 모듈화되어 재사용 가능

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 베트남어 콘텐츠 정확성 부족 | High | Medium | 원어민/전문가 검수, 공식 교재 참고 |
| 오프라인 환경에서 file:// 프로토콜 제한 | High | High | fetch 대신 script 태그로 JSON 로드, 또는 JS 변수로 데이터 관리 |
| 오디오 재생 호환성 (file:// 환경) | Medium | Medium | HTML5 Audio 태그 사용, 상대 경로 참조 |
| localStorage 용량 제한 (5~10MB) | Low | Low | 학습 진도만 저장, 콘텐츠는 파일로 관리 |
| 사용자 JSON 편집 실수 | Medium | High | JSON 포맷 가이드 문서 제공, 에러 시 기본값 로드 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure (HTML/CSS/JS) | Static sites, learning tools | ✅ |
| Dynamic | Feature-based modules, BaaS integration | Web apps with backend | ☐ |
| Enterprise | Strict layer separation, microservices | High-traffic systems | ☐ |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Framework | None (Vanilla) / Next.js | Vanilla HTML/CSS/JS | 보안 사업장, 빌드 도구 불가, 폴더 복사 배포 |
| Styling | Vanilla CSS / Tailwind | Vanilla CSS | 외부 의존성 제로, 오프라인 환경 |
| Data Format | JSON 파일 / JS 변수 | JS 파일 (data/*.js) | file:// 에서 fetch 불가 → script 태그로 로드 |
| Data Storage | localStorage | localStorage | 학습 진도, 간격 반복 주기 저장 |
| Audio | HTML5 Audio 태그 | HTML5 Audio | 외부 라이브러리 없이 음성 재생 |
| Extensibility | 모듈 패턴 | IIFE + 네임스페이스 패턴 | ES Module은 file://에서 CORS 제한, IIFE로 대체 |

### 6.3 배포 및 실행 환경

```
배포 방식: 폴더 통째로 복사 → 대상 PC에 붙여넣기 → index.html 더블클릭
실행 환경: file:// 프로토콜 (로컬 파일 직접 열기)
제약 사항:
  - ES Module (import/export) 사용 불가 → <script> 태그 순서로 로드
  - fetch() API 사용 불가 → JS 파일에 데이터를 변수로 선언
  - 외부 CDN 사용 불가 → 모든 리소스 로컬 포함
```

### 6.4 프로젝트 구조

```
chao-opic/
├── index.html                  # 메인 페이지
├── simulation.html             # 시험 시뮬레이션
├── topics.html                 # 주제별 학습
├── vocabulary.html             # 어휘 학습 (간격 반복)
├── css/
│   └── style.css               # 전역 스타일
├── js/
│   ├── core/                   # 핵심 공통 모듈
│   │   ├── app.js              # 앱 초기화, 네임스페이스 설정
│   │   ├── router.js           # 페이지 네비게이션 유틸
│   │   ├── storage.js          # localStorage 래퍼 (읽기/쓰기/초기화)
│   │   ├── audio.js            # 오디오 재생/녹음 공통 유틸
│   │   ├── timer.js            # 타이머 공통 유틸
│   │   └── ui.js               # 공통 UI 컴포넌트 (카드, 모달, 토글 등)
│   ├── pages/                  # 페이지별 로직
│   │   ├── simulation.js       # 시험 시뮬레이션 로직
│   │   ├── topics.js           # 주제별 학습 로직
│   │   └── vocabulary.js       # 어휘 학습 로직 (간격 반복 알고리즘)
│   └── data/                   # 데이터 파일 (사용자 편집 가능)
│       ├── topics/             # 주제별 데이터
│       │   ├── self-intro.js   # 자기소개
│       │   ├── hobby.js        # 취미/여가
│       │   ├── travel.js       # 여행
│       │   └── ...
│       ├── vocabulary/         # 어휘 데이터
│       │   └── words.js        # 단어 리스트
│       └── simulation/         # 시뮬레이션 데이터
│           └── questions.js    # 시험 질문 풀
├── audio/                      # 음성 파일 (사용자 교체 가능)
│   ├── topics/                 # 주제별 음성
│   │   ├── self-intro/
│   │   ├── hobby/
│   │   └── ...
│   └── simulation/             # 시뮬레이션용 음성
├── images/                     # 이미지 파일
├── docs/                       # PDCA 문서
│   ├── 01-plan/
│   ├── 02-design/
│   ├── 03-analysis/
│   └── 04-report/
├── CLAUDE.md
└── README.md
```

### 6.5 사용자 커스터마이징 가이드

사용자가 직접 수정 가능한 영역:

| 대상 | 위치 | 방법 |
|------|------|------|
| 주제별 질문/스크립트 | `js/data/topics/*.js` | JS 파일 내 배열 데이터 수정 |
| 단어 리스트 | `js/data/vocabulary/words.js` | JS 파일 내 배열 데이터 수정 |
| 시뮬레이션 질문 | `js/data/simulation/questions.js` | JS 파일 내 배열 데이터 수정 |
| 음성 파일 | `audio/topics/*/`, `audio/simulation/` | mp3/wav 파일 교체 (파일명 동일하게) |

데이터 파일 형식 예시:
```javascript
// js/data/topics/self-intro.js
var ChaoOPIc = ChaoOPIc || {};
ChaoOPIc.topics = ChaoOPIc.topics || {};
ChaoOPIc.topics.selfIntro = {
  title: "자기소개",
  questions: [
    {
      id: "si-01",
      text: "Hãy giới thiệu về bản thân bạn.",
      translation: "자기소개를 해주세요.",
      audio: "audio/topics/self-intro/si-01.mp3",
      sampleAnswer: "Xin chào, tôi tên là...",
      sampleTranslation: "안녕하세요, 제 이름은..."
    }
  ]
};
```

### 6.6 설계 원칙

| 원칙 | 설명 |
|------|------|
| **IIFE + 네임스페이스** | 전역 오염 방지, `ChaoOPIc` 단일 네임스페이스 사용 |
| **함수 재사용** | core/ 모듈에 공통 함수 집중, 페이지별 로직은 조합만 |
| **데이터-로직 분리** | 데이터(data/)와 로직(pages/) 완전 분리 → 데이터만 수정하면 내용 변경 |
| **확장성** | 새 주제 추가 = data 파일 추가 + audio 폴더 추가 (코드 수정 불필요) |
| **오프라인 완전 동작** | 외부 리소스 의존 제로, file:// 프로토콜 호환 |

---

## 7. 페이지 구성 계획

### 7.1 메인 페이지 (index.html)
- 프로그램 소개 히어로 섹션
- 4가지 기능 카드:
  1. **오픽 시뮬레이션** - 실제 시험과 동일한 모의 시험
  2. **주제별 연습** - 주제별 문제 듣기 및 답변 연습
  3. **어휘 학습** - 간격 반복으로 핵심 어휘 암기
  4. **학습 자료 관리** - 사용자 커스터마이징 가이드
- 네비게이션 헤더

### 7.2 시험 시뮬레이션 (simulation.html)
- OPIc 시험 흐름 재현:
  1. **Background Survey** - 관심 분야/난이도 선택
  2. **시험 안내** - 시험 진행 방식 안내
  3. **질문 출제** - 선택한 주제 기반 질문 랜덤 출제
  4. **답변 시간** - 40분 전체 타이머 + 문항별 안내
- 질문 간 이동 (이전/다음)
- 시험 종료 후 답변 내역 확인

### 7.3 주제별 학습 (topics.html)
- localStorage에 저장된 학습 데이터 기반 주제 목록 표시
- 주제 선택 → 질문 리스트 표시
- 각 질문별:
  - 음성 듣기 (HTML5 Audio)
  - 답변 녹음/재생 (Web Audio API)
  - 문제 스크립트 표시 (베트남어)
  - 한국어 해석 토글
  - 모범 답변 보기

### 7.4 어휘 학습 (vocabulary.html)
- JSON(JS) 파일 기반 단어 리스트 로드
- **AnkiDroid식 간격 반복 학습(SRS)**:
  - 카드 형태 UI (앞면: 베트남어 / 뒷면: 한국어 뜻 + 예문)
  - 난이도 선택: 다시(1분) / 어려움(10분) / 보통(1일) / 쉬움(4일)
  - 다음 복습 시간 자동 계산 → localStorage에 저장
- 학습 통계: 오늘 학습한 카드 수, 남은 카드 수
- 사용자가 `js/data/vocabulary/words.js` 수정으로 단어 추가/삭제 가능

### 7.5 학습 자료 관리 (가이드 페이지 또는 index.html 내 섹션)
- 사용자 커스터마이징 방법 안내
- 수정 가능한 파일 목록 및 위치 안내
- 데이터 파일 포맷 예시 제공
- JSON(JS) 편집 시 주의사항 안내

---

## 8. Next Steps

1. [ ] Design 문서 작성 (`/pdca design opic-learning`)
2. [ ] 데이터 구조 상세 설계 (질문, 어휘, 시뮬레이션 데이터)
3. [ ] 간격 반복 알고리즘 설계 (SM-2 변형)
4. [ ] 페이지별 UI 와이어프레임 설계
5. [ ] 구현 시작

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-10 | Initial draft | Haewoon |
| 0.2 | 2026-02-10 | 배포 환경, 확장성 설계, 페이지 구성 전면 수정 | Haewoon |
