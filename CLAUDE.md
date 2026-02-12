# ChaoOPIc

## Project Level: Starter

## Description
베트남어 OPIc 시험 시뮬레이션 및 학습 보조 프로그램
보안 사업장용 오프라인 학습 도구 (file:// 프로토콜 실행, 폴더 복사 배포)

## Tech Stack
- HTML5 / CSS3 / JavaScript (Vanilla)
- No frameworks, no build tools, no external CDN
- IIFE + ChaoOPIc 네임스페이스 패턴 (ES Module 미사용)
- localStorage for SRS progress

## Project Structure
```
chao-opic/
├── index.html              # 메인 페이지
├── simulation.html         # 시험 시뮬레이션
├── topics.html             # 주제별 학습
├── vocabulary.html         # 어휘 학습 (SRS)
├── css/style.css           # 전역 스타일
├── js/
│   ├── core/               # 공통 모듈 (IIFE)
│   │   ├── app.js          # 네임스페이스 초기화
│   │   ├── storage.js      # localStorage 래퍼
│   │   ├── audio.js        # 오디오 재생/녹음
│   │   ├── timer.js        # 타이머 유틸
│   │   ├── ui.js           # 공통 UI 헬퍼
│   │   └── dataLoader.js   # 데이터 검증/조회
│   ├── pages/              # 페이지별 로직
│   │   ├── simulation.js
│   │   ├── topics.js
│   │   └── vocabulary.js
│   └── data/               # 데이터 (사용자 편집 가능)
│       ├── topics/*.js
│       ├── vocabulary/words.js
│       └── simulation/questions.js
├── audio/                  # 음성 파일 (사용자 교체 가능)
├── docs/                   # PDCA 문서
└── CLAUDE.md
```

## Conventions
- Language: Korean (UI), English (code variables/functions)
- JS: IIFE + ChaoOPIc namespace, no ES Modules
- CSS: CSS Variables for theming, BEM-like naming
- Data files: var ChaoOPIc.data.* pattern (script tag loading)
- File encoding: UTF-8

## Constraints
- file:// protocol only (no fetch, no ES Modules, no CORS)
- No external dependencies (zero CDN)
- Folder copy deployment (no build step)
