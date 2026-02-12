# opic-learning Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: ChaoOPIc
> **Version**: 1.0.0
> **Analyst**: gap-detector (automated)
> **Date**: 2026-02-11
> **Design Doc**: [opic-learning.design.md](../02-design/features/opic-learning.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Compare the design document (`docs/02-design/features/opic-learning.design.md`) against the actual implementation code to identify gaps, missing features, extra features, and inconsistencies. This is the **Check** phase of the PDCA cycle for the opic-learning feature.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/opic-learning.design.md`
- **Implementation Paths**:
  - Core modules: `js/core/` (app.js, storage.js, audio.js, timer.js, ui.js, dataLoader.js)
  - Page modules: `js/pages/` (simulation.js, topics.js, vocabulary.js)
  - Data files: `js/data/` (topics/*.js, vocabulary/words.js, simulation/questions.js)
  - HTML pages: index.html, simulation.html, topics.html, vocabulary.html
  - CSS: `css/style.css`
- **Analysis Date**: 2026-02-11

---

## 2. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Architecture (Namespace, Script Load, IIFE) | 97% | PASS |
| Data Model | 90% | PASS |
| Core Modules | 91% | PASS |
| Page Logic | 88% | PASS |
| CSS / UI | 92% | PASS |
| Error Handling | 95% | PASS |
| **Overall Match Rate** | **92%** | **PASS** |

---

## 3. Architecture Gap Analysis

### 3.1 Namespace Structure

| Design | Implementation | Status |
|--------|---------------|--------|
| `ChaoOPIc.config` with version, storagePrefix, debug | `app.js:7-11` -- version, storagePrefix, debug all present | MATCH |
| `ChaoOPIc.core = {}` | `app.js:13` -- present | MATCH |
| `ChaoOPIc.data = { topics: {}, vocabulary: {}, simulation: {} }` | `app.js:14` -- present | MATCH |
| `ChaoOPIc.pages = {}` | `app.js:15` -- present | MATCH |

Score: **100%** (4/4 items match)

### 3.2 Script Load Order

Design specifies: app.js -> storage.js -> audio.js -> timer.js -> ui.js -> dataLoader.js -> data files -> page script.

| Page | Design Order Followed | Status |
|------|----------------------|--------|
| index.html | app, storage, audio, timer, ui, dataLoader (no page script -- inline IIFE instead) | MATCH |
| simulation.html | app, storage, audio, timer, ui, dataLoader -> questions.js -> simulation.js | MATCH |
| topics.html | app, storage, audio, timer, ui, dataLoader -> topic data files -> topics.js | MATCH |
| vocabulary.html | app, storage, audio, timer, ui, dataLoader -> words.js -> vocabulary.js | MATCH |

Score: **100%** (4/4 pages correct)

### 3.3 IIFE Pattern Usage

| Module | Design: IIFE | Implementation: IIFE | Status |
|--------|:------------:|:--------------------:|--------|
| storage.js | Yes | Yes -- `(function() { ... })()` | MATCH |
| audio.js | Yes | Yes | MATCH |
| timer.js | Yes | Yes | MATCH |
| ui.js | Yes | Yes | MATCH |
| dataLoader.js | Yes | Yes | MATCH |
| simulation.js | Yes | Yes | MATCH |
| topics.js | Yes | Yes | MATCH |
| vocabulary.js | Yes | Yes | MATCH |

Score: **100%** (8/8 modules)

### 3.4 Architecture Deduction

| Item | Issue | Impact |
|------|-------|--------|
| index.html inline script | Design shows page script loaded from file; implementation uses inline `<script>` | Low -- functionally equivalent, acceptable for simple home page |

Architecture Score: **97%**

---

## 4. Data Model Gap Analysis

### 4.1 Topic Data Structure

Design schema:
```
{ id, title, titleVi, icon, questions: [{ id, text, translation, audio, sampleAnswer, sampleTranslation }] }
```

| File | id | title | titleVi | icon | questions fields | Status |
|------|:--:|:-----:|:-------:|:----:|:----------------:|--------|
| self-intro.js | MATCH | MATCH | MATCH | MATCH | All 6 fields present | MATCH |
| hobby.js | MATCH | MATCH | MATCH | MATCH | All 6 fields present | MATCH |
| travel.js | MATCH | MATCH | MATCH | MATCH | All 6 fields present | MATCH |
| work.js | MATCH | MATCH | MATCH | MATCH | All 6 fields present | MATCH |
| daily.js | MATCH | MATCH | MATCH | MATCH | All 6 fields present | MATCH |

Namespace guard pattern (`var ChaoOPIc = ChaoOPIc || {};` etc.): Present in all topic files -- MATCH.

### 4.2 Topic File Coverage

| Design Topic | File Exists | Status |
|--------------|:-----------:|--------|
| self-intro (자기소개) | Yes | MATCH |
| hobby (취미/여가) | Yes | MATCH |
| travel (여행) | Yes | MATCH |
| work (직장/업무) | Yes | MATCH |
| daily (일상생활) | Yes | MATCH |
| food (음식) | **No** | MISSING |
| shopping (쇼핑) | **No** | MISSING |
| technology (기술/인터넷) | **No** | MISSING |

Design specified 8 topics; implementation provides 5. Three topics are missing.

### 4.3 Vocabulary Data Structure

Design schema:
```
{ categories: [...], words: [{ id, word, meaning, pronunciation, example, exampleTranslation, category }] }
```

| Field | Design | Implementation | Status |
|-------|--------|---------------|--------|
| categories array | `["인사", "일상", "직장", "여행", "음식"]` | `["인사", "일상", "직장", "여행", "음식"]` | MATCH |
| word fields (7 fields) | id, word, meaning, pronunciation, example, exampleTranslation, category | All 7 present in all 20 words | MATCH |
| Namespace guard | Required | Present | MATCH |

Score: **100%**

### 4.4 Simulation Data Structure

Design schema:
```
{ surveyCategories: [...], difficultyLevels: [...], questions: [{ id, category, difficulty, text, translation, audio }], settings: { totalTimeMinutes, questionsPerSession, preparationTimeSec } }
```

| Field | Design | Implementation | Status |
|-------|--------|---------------|--------|
| surveyCategories (5 items) | 5 categories | 5 categories, exact match | MATCH |
| difficultyLevels (3 items) | IL, IM, IH | IL, IM, IH | MATCH |
| settings.totalTimeMinutes | 40 | 40 | MATCH |
| settings.questionsPerSession | 12 | 12 | MATCH |
| settings.preparationTimeSec | 20 | 20 | MATCH |
| questions fields (6 fields) | id, category, difficulty, text, translation, audio | All present in 15 questions | MATCH |

Score: **100%**

### 4.5 localStorage Data Structure

Design keys:
| Key | Design | Implementation | Status |
|-----|--------|---------------|--------|
| `chaoopic-srs` | `{ [wordId]: { interval, repetition, easeFactor, nextReview, lastReview } }` | Used in vocabulary.js -- fields match design | MATCH |
| `chaoopic-stats` | `{ totalReviewed, todayReviewed, todayDate, streak }` | Used in vocabulary.js -- fields match design | MATCH |

Score: **100%**

### 4.6 Data Model Summary

- Structure compliance: 100%
- Topic file coverage: 62.5% (5 of 8 topics)
- **Data Model Score: 90%** (weighted: structure matters more than quantity of sample data)

---

## 5. Core Modules Gap Analysis

### 5.1 storage.js

| Design Function | Implemented | Signature Match | Error Handling | Status |
|----------------|:-----------:|:---------------:|:--------------:|--------|
| `get(key)` | Yes | Yes -- returns parsed JSON or null | try-catch, returns null on parse error | MATCH |
| `set(key, value)` | Yes | Yes | try-catch, shows toast on failure | MATCH |
| `remove(key)` | Yes | Yes | N/A | MATCH |
| `clear()` | Yes | Yes -- iterates PREFIX keys | N/A | MATCH |

Score: **100%** (4/4 functions)

### 5.2 audio.js

| Design Function | Implemented | Signature Match | Status |
|----------------|:-----------:|:---------------:|--------|
| `play(src, onEnded)` | Yes | Yes | MATCH |
| `stop()` | Yes | Yes -- pause + currentTime=0 | MATCH |
| `isPlaying()` | Yes | Yes | MATCH |
| `recorder.start(onDataAvailable)` | Yes | Param name differs: `onReady` vs `onDataAvailable` | MINOR CHANGE |
| `recorder.stop()` | Yes | Returns blob via `onBlob` callback (design: returns Blob) | MINOR CHANGE |
| `recorder.isSupported()` | Yes | Yes | MATCH |
| `recorder.isRecording()` | **Yes** (added) | N/A -- not in design | ADDED |

| Item | Description | Impact |
|------|-------------|--------|
| `recorder.start` callback name | Design: `onDataAvailable`, Impl: `onReady` | Low -- behavioral difference: impl calls onReady when recording starts, not on each data chunk |
| `recorder.stop` return mechanism | Design: returns Blob, Impl: callback `onBlob` | Low -- async callback pattern is actually more appropriate for async operation |
| `recorder.isRecording()` added | Not in design | Low -- useful utility, no harm |

Score: **88%** (6/6 design functions present, 2 minor signature differences, 1 addition)

### 5.3 timer.js

| Design Function | Implemented | Signature Match | Status |
|----------------|:-----------:|:---------------:|--------|
| `create(options)` | Yes | Yes -- duration, countDown, onTick, onComplete | MATCH |
| `create().start()` | Yes | Yes | MATCH |
| `create().pause()` | Yes | Yes | MATCH |
| `create().resume()` | Yes | Yes | MATCH |
| `create().reset()` | Yes | Yes | MATCH |
| `create().getRemaining()` | Yes | Yes | MATCH |
| `formatTime(seconds)` | Yes | Yes -- MM:SS or HH:MM:SS | MATCH |
| `create().isRunning()` | **Yes** (added) | N/A | ADDED |

Score: **96%** (7/7 design functions match, 1 useful addition)

### 5.4 ui.js

| Design Function | Implemented | Signature Match | Status |
|----------------|:-----------:|:---------------:|--------|
| `renderNav(currentPage)` | Yes | Yes | MATCH |
| `renderCard(options)` | **No** | N/A | MISSING |
| `showModal(options)` | Yes | Yes -- title, content, buttons, close on overlay click | MATCH |
| `hideModal()` | Yes | Yes | MATCH |
| `showToast(message, type)` | Yes | Yes -- 3-second auto-dismiss, success/error/info | MATCH |
| `renderToggle(label, initialState, onChange)` | **No** | N/A | MISSING |
| `renderProgress(current, total)` | Yes | Signature changed: `(container, current, total)` | MINOR CHANGE |
| `$(selector)` | Yes | Yes | MATCH |
| `$$(selector)` | Yes | Returns Array (design: NodeList) | MINOR CHANGE |
| `createElement(tag, attrs, children)` | Yes | Yes -- extended with className, events, innerHTML | MATCH |

| Item | Description | Impact |
|------|-------------|--------|
| `renderCard()` missing | Design specified card component generator function | Medium -- cards are built inline in page modules using createElement instead |
| `renderToggle()` missing | Design specified toggle component generator | Medium -- toggle functionality is implemented inline in topics.js |
| `renderProgress` signature | Added `container` as first param | Low -- container param is actually more flexible |
| `$$` returns Array | Design: NodeList, Impl: `Array.prototype.slice.call(querySelectorAll)` | Low -- Array is more convenient |

Score: **78%** (8/10 design functions: 2 missing, 2 minor changes)

### 5.5 dataLoader.js

| Design Function | Implemented | Signature Match | Status |
|----------------|:-----------:|:---------------:|--------|
| `getTopicList()` | Yes | Yes -- returns { id, title, titleVi, icon, questionCount } | MATCH |
| `getTopic(topicId)` | Yes | Yes -- returns null + console.warn if missing | MATCH |
| `getVocabulary(category)` | Yes | Yes -- filters by category, returns all if null | MATCH |
| `getSimulationQuestions(categories, difficulty, count)` | Yes | Yes -- Fisher-Yates shuffle, filter, slice | MATCH |
| `validate(data, schema)` | **No** | N/A | MISSING |
| `getVocabularyCategories()` | **Yes** (added) | N/A | ADDED |
| `getSimulationConfig()` | **Yes** (added) | N/A | ADDED |
| `getSurveyCategories()` | **Yes** (added) | N/A | ADDED |
| `getDifficultyLevels()` | **Yes** (added) | N/A | ADDED |
| `shuffle` (exposed) | **Yes** (added) | N/A | ADDED |

| Item | Description | Impact |
|------|-------------|--------|
| `validate(data, schema)` missing | Design specified a generic validation function | Medium -- validation is done inline in individual getter functions instead |
| 5 functions added | Convenience accessors for simulation config, survey categories, difficulty levels, vocabulary categories, shuffle | Low -- useful decomposition, improves encapsulation |

Score: **88%** (4/5 design functions present, 1 missing, 5 useful additions)

### 5.6 Core Modules Summary

| Module | Score | Notes |
|--------|:-----:|-------|
| storage.js | 100% | Perfect match |
| audio.js | 88% | Minor callback signature differences, 1 addition |
| timer.js | 96% | 1 useful addition (isRunning) |
| ui.js | 78% | 2 functions missing (renderCard, renderToggle) |
| dataLoader.js | 88% | validate() missing, 5 useful additions |

**Core Modules Score: 91%**

---

## 6. Page Logic Gap Analysis

### 6.1 simulation.js -- 3-Step Flow

Design specifies: survey -> guide -> exam -> result (4 states)

| Design Function | Implemented | Status |
|----------------|:-----------:|--------|
| State: step, selectedCategories, selectedDifficulty, questions, currentIndex, timer, recordings | Yes -- all state fields present | MATCH |
| `init()` | Yes | MATCH |
| `renderSurvey()` | Yes -- checkbox group for categories, radio for difficulty | MATCH |
| `onSurveySubmit()` | Yes -- validation (min 1 category), calls getSimulationQuestions | MATCH |
| `renderGuide()` | Yes -- shows test info, back button, start button | MATCH |
| `renderExam()` | Yes -- timer, progress bar, question card, audio, recording | MATCH |
| `nextQuestion()` | Yes -- inline click handler | MATCH |
| `prevQuestion()` | Yes -- inline click handler | MATCH |
| `onTimerComplete()` | Yes -- shows modal with "result" button | MATCH |
| `renderResult()` | Yes -- shows stats, per-question review with recording playback | MATCH |
| Step indicator (visual) | Yes -- 3-step indicator with active/completed states | ADDED (enhancement) |
| "End exam" button | Yes -- shows confirmation modal | ADDED (enhancement) |

| Item | Description | Impact |
|------|-------------|--------|
| Functions not individually exposed on return object | Design showed individual named functions; impl uses private functions, only exposes `init()` | Low -- internal organization choice, all functionality present |

Score: **100%** (all design features present, with useful enhancements)

### 6.2 topics.js -- 2-Step UI

Design specifies: list -> detail (2 views)

| Design Function | Implemented | Status |
|----------------|:-----------:|--------|
| State: view, currentTopic, currentIndex, showTranslation, showSampleAnswer | Yes -- `showSample` instead of `showSampleAnswer`, added `recordingBlob` | MATCH (minor rename) |
| `init()` | Yes | MATCH |
| `renderTopicList()` | Yes -- uses dataLoader.getTopicList(), grid layout | MATCH |
| `selectTopic(topicId)` | Yes -- loads topic, resets state | MATCH |
| `renderQuestion()` | Yes -- Vietnamese text, audio, translation toggle, sample toggle | MATCH |
| `playAudio()` | Yes -- inline via `audio.play(q.audio)` | MATCH |
| `startRecording()` / `stopRecording()` | Yes -- toggle button pattern | MATCH |
| `playRecording()` | Yes -- via `renderPlayback()` function | MATCH |
| `toggleTranslation()` | Yes -- inline click handler | MATCH |
| `toggleSampleAnswer()` | Yes -- inline click handler | MATCH |
| `nextQuestion()` / `prevQuestion()` | Yes -- resets toggles on navigation | MATCH |

| Item | Description | Impact |
|------|-------------|--------|
| `showSampleAnswer` -> `showSample` | State property renamed | None -- cosmetic |
| `recordingBlob` added to state | Not in design | None -- needed for playback feature |
| Empty topic list message | Implementation shows helpful message when no topics found | Enhancement |

Score: **100%** (all design features present)

### 6.3 vocabulary.js -- SRS Algorithm

Design specifies: SM-2 variant with 4 difficulty levels

#### SRS Algorithm Comparison

| SRS Detail | Design | Implementation | Status |
|------------|--------|---------------|--------|
| INTERVALS.again | 1 min (60000ms) | 1 * 60 * 1000 | MATCH |
| INTERVALS.hard | 10 min (600000ms) | 10 * 60 * 1000 | MATCH |
| INTERVALS.good | 1 day (86400000ms) | 1 * 24 * 60 * 60 * 1000 | MATCH |
| INTERVALS.easy | 4 days (345600000ms) | 4 * 24 * 60 * 60 * 1000 | MATCH |
| quality < 2: reset repetition | Yes | Yes | MATCH |
| quality < 2: easeFactor -= 0.2, min 1.3 | Yes | Yes (with null-safe `card.easeFactor \|\| 2.5`) | MATCH |
| quality >= 2: newRep = rep + 1 | Yes | Yes | MATCH |
| quality >= 2: EF formula | `EF + (0.1 - (3 - q) * 0.08)` | Same formula | MATCH |
| EF minimum 1.3 | Yes | Yes | MATCH |
| newRep === 1: base interval | Yes | `newRep <= 1` (uses <=) | MINOR CHANGE |
| newRep > 1: interval * EF | Yes | Yes (with null-safe fallback) | MATCH |
| createNew(wordId) | Returns default card | `createNew()` -- no wordId param (not needed) | MINOR CHANGE |

#### Page Functions Comparison

| Design Function | Implemented | Status |
|----------------|:-----------:|--------|
| `init()` | Yes -- loadStats, prepareCards, render | MATCH |
| `renderCard()` | Yes -- via `render()` function | MATCH |
| `revealAnswer()` | Yes -- sets showAnswer=true, re-renders | MATCH |
| `rate(quality)` | Yes -- via `rateCard(word, quality)` | MATCH |
| `renderStats()` | Yes -- via `renderHeader()` with stats bar | MATCH |
| `setFilter(category)` | Yes -- via filter button click handlers | MATCH |
| Card preparation (due + new) | Yes -- `prepareCards()` separates dueCards and newCards | MATCH |
| "Learning complete" screen | Yes -- `renderComplete()` | ADDED |
| "Reset SRS data" feature | Yes -- clear modal in renderComplete | ADDED |
| Category filter buttons | Yes -- dynamic filter UI | ADDED |

Score: **95%** (all design features present, 2 minor SRS implementation differences)

### 6.4 index.html -- Main Page

| Design Element | Implemented | Status |
|----------------|:-----------:|--------|
| Navigation bar | Yes -- header with logo + nav-links | MATCH |
| Hero section | Yes -- title + description | MATCH |
| 4 cards (simulation, topics, vocabulary, guide) | Yes -- all 4 present | MATCH |
| "Guide" card opens customization modal | Yes -- shows file paths, instructions | MATCH |
| Footer with copyright | Yes | MATCH |

Score: **100%**

### 6.5 Page Logic Summary

| Page | Score | Notes |
|------|:-----:|-------|
| index.html | 100% | Complete |
| simulation.js | 100% | All flows implemented with enhancements |
| topics.js | 100% | All features implemented |
| vocabulary.js | 95% | Minor SRS implementation differences |

**Page Logic Score: 88%** (weighted slightly lower due to functions being private rather than public API as designed)

---

## 7. CSS / UI Gap Analysis

### 7.1 CSS Variables

| Design Variable | Implementation | Status |
|-----------------|---------------|--------|
| `--color-primary: #1e40af` | `#1e40af` | MATCH |
| `--color-primary-light: #3b82f6` | `#3b82f6` | MATCH |
| `--color-secondary: #059669` | `#059669` | MATCH |
| `--color-bg: #f9fafb` | `#f0f4f8` | CHANGED |
| `--color-surface: #ffffff` | `#ffffff` | MATCH |
| `--color-text: #1f2937` | `#1f2937` | MATCH |
| `--color-text-light: #6b7280` | `#6b7280` | MATCH |
| `--color-border: #e5e7eb` | `#e5e7eb` | MATCH |
| `--color-error: #dc2626` | `#dc2626` | MATCH |
| `--color-success: #16a34a` | `#16a34a` | MATCH |
| `--space-xs` through `--space-xl` | All match | MATCH |
| `--radius-sm/md/lg` | All match | MATCH |
| `--shadow-sm/md` | Match | MATCH |
| `--color-primary-dark` | **Added**: `#1e3a8a` | ADDED |
| `--color-secondary-light` | **Added**: `#10b981` | ADDED |
| `--color-warning` | **Added**: `#f59e0b` | ADDED |
| `--shadow-lg` | **Added**: `0 8px 24px rgba(0,0,0,0.12)` | ADDED |
| `--font-family` | **Added**: Segoe UI stack | ADDED |

| Item | Description | Impact |
|------|-------------|--------|
| `--color-bg` changed | Design: `#f9fafb`, Impl: `#f0f4f8` | Low -- slightly different gray tint |
| 5 variables added | primary-dark, secondary-light, warning, shadow-lg, font-family | Low -- useful extensions |

### 7.2 Common Component CSS Classes

| Design Class | Implemented | Status |
|--------------|:-----------:|--------|
| `.container` (max-width 1024px) | Yes | MATCH |
| `.card` (hover effect) | Yes -- translateY(-4px) on hover | MATCH |
| `.btn`, `.btn-primary`, `.btn-secondary` | Yes | MATCH |
| `.btn-icon` | Yes -- circular 48px | MATCH |
| `.toggle` | **No** -- `.translation-toggle` used instead | CHANGED |
| `.modal`, `.modal-overlay` | Yes | MATCH |
| `.toast` | Yes -- with animation | MATCH |
| `.progress-bar` | Yes | MATCH |
| `.timer-display` | Yes -- with warning/danger states | MATCH |
| `.srs-buttons` | Yes -- grid layout | MATCH |
| `.nav`, `.nav-item`, `.nav-active` | Yes -- `.nav-links`, `.nav-item`, `.nav-active` | MATCH |
| `.question-card` | Yes | MATCH |
| `.flip-card` | Yes -- with flip-card-container | MATCH |
| `.btn-success` | **Added** | ADDED |
| `.btn-danger` | **Added** | ADDED |
| `.btn-group` | **Added** | ADDED |
| `.step-indicator` / `.step` | **Added** -- simulation step progress | ADDED |
| `.topic-grid` / `.topic-card` | **Added** -- topic selection grid | ADDED |
| `.stats-bar` / `.stat-item` | **Added** -- statistics display | ADDED |
| `.survey-section` / `.checkbox-group` / `.radio-group` | **Added** -- form components | ADDED |
| `.hero` / `.card-grid` / `.card-icon` | **Added** -- home page components | ADDED |
| Utility classes (`.text-center`, `.text-muted`, `.mt-md`, etc.) | **Added** | ADDED |

| Item | Description | Impact |
|------|-------------|--------|
| `.toggle` class missing | Design specified `.toggle`; implementation uses `.translation-toggle` with `.hidden` class | Low -- functionally equivalent |

### 7.3 Responsive Breakpoints

| Design Breakpoint | Implementation | Status |
|-------------------|---------------|--------|
| Mobile: default | Yes -- mobile-first approach | MATCH |
| Tablet: 768px | Yes -- `@media (max-width: 768px)` | MATCH (direction reversed but equivalent) |
| Desktop: 1024px | **No** -- 1024px breakpoint not explicitly defined | MISSING |
| Extra: 480px | **Added** -- `@media (max-width: 480px)` for very small screens | ADDED |

| Item | Description | Impact |
|------|-------------|--------|
| Desktop 1024px breakpoint missing | Design specifies `min-width: 1024px`; not implemented | Low -- container max-width is 1024px, so layout works implicitly |
| Mobile-first vs Desktop-first | Design uses min-width (mobile-first), impl uses max-width (desktop-first) | Low -- equivalent visual result |

### 7.4 CSS Score

**CSS / UI Score: 92%**

---

## 8. Error Handling Gap Analysis

| Design Scenario | Implementation | Status |
|-----------------|---------------|--------|
| Data file missing (JS variable undefined) | `dataLoader` getters check for null/undefined data, return empty arrays, console.warn | MATCH |
| Audio file missing | `audio.play()` onerror -> console.warn + showToast "음성 파일을 찾을 수 없습니다" | MATCH |
| localStorage full | `storage.set()` try-catch -> showToast "저장 공간이 부족합니다" | MATCH |
| Microphone permission denied | `recorder.start()` catch -> showToast "마이크 권한이 필요합니다" | MATCH |
| User data format error | `dataLoader.validate()` design -> **Not implemented as formal function**, but inline checks in getters | PARTIAL |
| Browser doesn't support MediaRecorder | `recorder.isSupported()` check -> showToast "이 브라우저에서는 녹음이 지원되지 않습니다" | MATCH (exceeds design) |
| No matching simulation questions | Shows toast "선택한 조건에 맞는 질문이 없습니다" | ADDED (enhancement) |
| Empty topic data | Shows helpful message in topics.js | ADDED (enhancement) |

**Error Handling Score: 95%** (only formal validate() function missing, but functionality covered inline)

---

## 9. Differences Found

### 9.1 MISSING Features (Design: present, Implementation: absent)

| # | Item | Design Location | Description | Impact |
|---|------|-----------------|-------------|--------|
| 1 | Topic: food (음식) | design.md Section 3.1, line 173 | `food.js` data file not created | Medium |
| 2 | Topic: shopping (쇼핑) | design.md Section 3.1, line 174 | `shopping.js` data file not created | Medium |
| 3 | Topic: technology (기술/인터넷) | design.md Section 3.1, line 175 | `technology.js` data file not created | Medium |
| 4 | `ui.renderCard(options)` | design.md Section 4.5, line 389 | Card rendering helper not implemented | Medium |
| 5 | `ui.renderToggle(label, initialState, onChange)` | design.md Section 4.5, line 407 | Toggle component helper not implemented | Medium |
| 6 | `dataLoader.validate(data, schema)` | design.md Section 4.6, line 449 | Generic validation function not implemented | Low |
| 7 | CSS `@media (min-width: 1024px)` breakpoint | design.md Section 6.3, line 833 | Desktop breakpoint not explicitly defined | Low |

### 9.2 ADDED Features (Design: absent, Implementation: present)

| # | Item | Implementation Location | Description | Impact |
|---|------|------------------------|-------------|--------|
| 1 | `audio.recorder.isRecording()` | `js/core/audio.js:76` | Check if currently recording | Low (useful) |
| 2 | `timer.create().isRunning()` | `js/core/timer.js:64` | Check if timer is active | Low (useful) |
| 3 | `dataLoader.getVocabularyCategories()` | `js/core/dataLoader.js:59` | Get vocabulary category list | Low (useful) |
| 4 | `dataLoader.getSimulationConfig()` | `js/core/dataLoader.js:80` | Get simulation settings | Low (useful) |
| 5 | `dataLoader.getSurveyCategories()` | `js/core/dataLoader.js:90` | Get survey category options | Low (useful) |
| 6 | `dataLoader.getDifficultyLevels()` | `js/core/dataLoader.js:96` | Get difficulty level options | Low (useful) |
| 7 | `dataLoader.shuffle` (exposed) | `js/core/dataLoader.js:101` | Fisher-Yates shuffle as public utility | Low (useful) |
| 8 | Simulation step indicator UI | `js/pages/simulation.js:24-45` | Visual step progress (1-2-3) | Low (enhancement) |
| 9 | Simulation "End exam" button | `js/pages/simulation.js:252-265` | Early termination with confirmation | Low (enhancement) |
| 10 | Vocabulary "Learning complete" screen | `js/pages/vocabulary.js:257-295` | Completion state with reset option | Low (enhancement) |
| 11 | Vocabulary "Reset SRS data" feature | `js/pages/vocabulary.js:270-290` | Clear all learning progress | Low (useful) |
| 12 | Additional CSS variables (5) | `css/style.css:9,11,19,33,35` | primary-dark, secondary-light, warning, shadow-lg, font-family | Low (extension) |
| 13 | Additional CSS components | `css/style.css` various | step-indicator, topic-grid, stats-bar, survey-section, utility classes | Low (extension) |
| 14 | `@media (max-width: 480px)` breakpoint | `css/style.css:761-764` | Very small screen support | Low (enhancement) |

### 9.3 CHANGED Features (Design != Implementation)

| # | Item | Design | Implementation | Impact |
|---|------|--------|---------------|--------|
| 1 | `audio.recorder.start` callback | `onDataAvailable` -- called on each data chunk | `onReady` -- called once when recording starts | Low |
| 2 | `audio.recorder.stop` return | Returns Blob directly | Callback pattern `onBlob(blob)` | Low |
| 3 | `ui.renderProgress` signature | `renderProgress(current, total)` | `renderProgress(container, current, total)` | Low |
| 4 | `ui.$$` return type | Returns NodeList | Returns Array (via `Array.prototype.slice.call`) | Low |
| 5 | `--color-bg` value | `#f9fafb` | `#f0f4f8` | Low |
| 6 | `.toggle` CSS class name | `.toggle` | `.translation-toggle` + `.hidden` | Low |
| 7 | Responsive approach | `min-width` (mobile-first) | `max-width` (desktop-first) | Low |
| 8 | SRS `createNew(wordId)` param | Accepts `wordId` | No parameter (not needed) | Low |
| 9 | SRS `newRep === 1` check | `===` (strict equality) | `<= 1` (includes 0 and 1) | Low |
| 10 | Page module public API | Multiple named functions exposed | Only `init()` exposed; rest are private | Low |

---

## 10. Architecture / Convention Compliance

### 10.1 Namespace / Architecture Compliance

| Rule | Status | Notes |
|------|--------|-------|
| Single `ChaoOPIc` namespace | PASS | No other global variables introduced |
| IIFE pattern for all modules | PASS | All 8 modules use IIFE |
| Data-logic separation | PASS | `js/data/` (content) vs `js/core/` + `js/pages/` (logic) |
| Zero external dependencies | PASS | No external libraries |
| file:// protocol compatibility | PASS | No fetch(), no ES modules, script tag loading |
| Namespace guard in data files | PASS | All data files use `var ChaoOPIc = ChaoOPIc || {}` pattern |

### 10.2 Naming Convention

| Category | Convention | Compliance | Violations |
|----------|-----------|:----------:|------------|
| Namespace | PascalCase (ChaoOPIc) | 100% | None |
| Functions | camelCase | 100% | None |
| Variables | camelCase | 100% | None |
| Files (data) | kebab-case.js | 100% | None |
| Files (modules) | camelCase.js | 100% | None |
| CSS classes | kebab-case | 100% | None |
| CSS variables | kebab-case with -- prefix | 100% | None |
| localStorage keys | kebab-case with prefix | 100% | None |

### 10.3 Code Quality

| Metric | Observation |
|--------|-------------|
| Consistent code style | Yes -- same patterns across all files |
| Comments / documentation | JSDoc headers on all modules, inline comments |
| Error handling consistency | All modules use try-catch or null checks |
| No console.error / console.log leaks | Only console.warn used (appropriate) |

---

## 11. Match Rate Calculation

### Per-Section Breakdown

| Section | Weight | Score | Weighted |
|---------|:------:|:-----:|:--------:|
| Architecture (namespace, load order, IIFE) | 15% | 97% | 14.55 |
| Data Model (structures + topic coverage) | 15% | 90% | 13.50 |
| Core Modules (5 modules, all functions) | 25% | 91% | 22.75 |
| Page Logic (4 pages, all flows) | 25% | 88% | 22.00 |
| CSS / UI (variables, components, responsive) | 10% | 92% | 9.20 |
| Error Handling (graceful degradation) | 10% | 95% | 9.50 |
| **Total** | **100%** | | **91.50** |

### Overall Match Rate: **92%**

```
+---------------------------------------------+
|  Overall Match Rate: 92%                     |
+---------------------------------------------+
|  PASS  Architecture:     97%                 |
|  PASS  Data Model:       90%                 |
|  PASS  Core Modules:     91%                 |
|  PASS  Page Logic:       88%                 |
|  PASS  CSS / UI:         92%                 |
|  PASS  Error Handling:   95%                 |
+---------------------------------------------+
|  Missing items:   7                          |
|  Added items:    14                          |
|  Changed items:  10                          |
+---------------------------------------------+
```

---

## 12. Recommended Actions

### 12.1 Immediate Actions (Impact: Medium)

| # | Action | Files Affected | Effort |
|---|--------|---------------|--------|
| 1 | Create missing topic data files: food.js, shopping.js, technology.js | `js/data/topics/food.js`, `shopping.js`, `technology.js` | Low -- template exists |
| 2 | Add missing topics to topics.html script tags | `topics.html` | Low |

### 12.2 Short-term Actions (Impact: Low-Medium)

| # | Action | Files Affected | Effort |
|---|--------|---------------|--------|
| 3 | Implement `ui.renderCard()` generic card builder | `js/core/ui.js` | Low |
| 4 | Implement `ui.renderToggle()` generic toggle builder | `js/core/ui.js` | Low |
| 5 | Implement `dataLoader.validate()` generic schema validator | `js/core/dataLoader.js` | Medium |
| 6 | Add `@media (min-width: 1024px)` desktop breakpoint | `css/style.css` | Low |
| 7 | Fix `--color-bg` to match design (`#f9fafb`) or update design | `css/style.css` or design doc | Low |

### 12.3 Documentation Updates Needed

The following additions/changes in implementation should be reflected in the design document:

| # | Item | Recommendation |
|---|------|---------------|
| 1 | 14 added features (utility functions, UI enhancements) | Update design to document these |
| 2 | `recorder.start` callback semantics (onReady vs onDataAvailable) | Update design to match impl |
| 3 | `recorder.stop` callback pattern | Update design to match impl |
| 4 | `renderProgress` container parameter | Update design to match impl |
| 5 | Page modules expose only `init()` | Update design to reflect encapsulation choice |
| 6 | Additional CSS variables and components | Update design Section 6 |

---

## 13. Conclusion

The implementation achieves a **92% match rate** with the design document, which exceeds the 90% threshold for PDCA Check phase approval. The codebase faithfully implements all core architectural decisions (IIFE pattern, namespace structure, script load order, data-logic separation, file:// compatibility) and all major features (simulation 3-step flow, topics 2-step UI, vocabulary SRS algorithm).

The primary gaps are:
- **3 missing topic data files** (food, shopping, technology) out of 8 planned
- **2 missing UI helper functions** (renderCard, renderToggle) that are functionally replaced by inline implementations
- **1 missing validation utility** that is functionally covered by inline checks

The implementation also includes 14 enhancements not in the original design (step indicator, exam termination, learning completion screen, additional utility functions, extra CSS components) that improve the user experience.

**Recommendation**: Create the 3 missing topic data files to bring Data Model score to 100%, then update the design document to reflect implementation improvements. No critical issues found.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-11 | Initial gap analysis | gap-detector |
