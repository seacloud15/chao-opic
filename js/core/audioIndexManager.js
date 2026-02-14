/**
 * ChaoOPIc - Audio Index Manager Module
 * File System Access API를 사용하여 오디오 파일 인덱스 생성 및 localStorage 관리
 *
 * IIFE 패턴, ChaoOPIc.core.audioIndexManager 네임스페이스
 */
ChaoOPIc.core.audioIndexManager = (function() {
  'use strict';

  var STORAGE_KEY = 'chaoopic_audio_index';
  var STORAGE_VERSION_KEY = 'chaoopic_audio_index_version';
  var CURRENT_VERSION = '1.0';

  /**
   * File System Access API 지원 여부 확인
   * @returns {boolean}
   */
  function isSupported() {
    return 'showDirectoryPicker' in window;
  }

  /**
   * 폴더 선택 및 스캔
   * @returns {Promise<Object>} - 생성된 인덱스 객체
   */
  async function selectAndScanFolder() {
    if (!isSupported()) {
      throw new Error('File System Access API가 지원되지 않는 브라우저입니다. Chrome, Edge 등을 사용하세요.');
    }

    try {
      // 폴더 선택 다이얼로그
      var dirHandle = await window.showDirectoryPicker({
        id: 'chaoopic-audio-folder',
        mode: 'read',
        startIn: 'documents'
      });

      console.log('[audioIndexManager] Selected folder:', dirHandle.name);

      // 폴더 스캔
      var index = await scanFolder(dirHandle);

      // localStorage에 저장
      saveToStorage(index);

      return index;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('[audioIndexManager] Folder selection cancelled');
        return null;
      }
      throw error;
    }
  }

  /**
   * 폴더 스캔 (재귀적)
   * @param {FileSystemDirectoryHandle} dirHandle - 폴더 핸들
   * @returns {Promise<Object>} - 인덱스 객체
   */
  async function scanFolder(dirHandle) {
    var index = {
      'self-introduction': [],
      'selfAssess': [],
      'survey': {},
      'non-survey': {},
      'rolePlay': {},
      'issueComparison': {}
    };

    // simulation 폴더 찾기
    var simulationHandle = await getFolderHandle(dirHandle, 'simulation');
    if (!simulationHandle) {
      throw new Error('simulation 폴더를 찾을 수 없습니다. audio/simulation 구조를 확인하세요.');
    }

    // 각 카테고리 스캔
    await scanCategory(simulationHandle, 'self-introduction', index);
    await scanCategory(simulationHandle, 'selfAssess', index);
    await scanCategory(simulationHandle, 'survey', index);
    await scanCategory(simulationHandle, 'non-survey', index);
    await scanCategory(simulationHandle, 'rolePlay', index);
    await scanCategory(simulationHandle, 'issueComparison', index);

    console.log('[audioIndexManager] Scan complete:', index);
    return index;
  }

  /**
   * 특정 폴더 핸들 가져오기
   * @param {FileSystemDirectoryHandle} parentHandle - 부모 폴더
   * @param {string} folderName - 찾을 폴더명
   * @returns {Promise<FileSystemDirectoryHandle|null>}
   */
  async function getFolderHandle(parentHandle, folderName) {
    try {
      return await parentHandle.getDirectoryHandle(folderName);
    } catch (error) {
      console.warn('[audioIndexManager] Folder not found:', folderName);
      return null;
    }
  }

  /**
   * 카테고리별 스캔
   * @param {FileSystemDirectoryHandle} simulationHandle - simulation 폴더 핸들
   * @param {string} category - 카테고리명
   * @param {Object} index - 인덱스 객체 (참조)
   */
  async function scanCategory(simulationHandle, category, index) {
    var categoryHandle = await getFolderHandle(simulationHandle, category);
    if (!categoryHandle) {
      console.warn('[audioIndexManager] Category not found:', category);
      return;
    }

    // self-introduction, selfAssess: 파일 직접 수집
    if (category === 'self-introduction' || category === 'selfAssess') {
      var files = await collectAudioFiles(categoryHandle, 'audio/simulation/' + category);
      index[category] = files;
      console.log('[audioIndexManager]', category + ':', files.length, 'files');
      return;
    }

    // survey, non-survey, rolePlay, issueComparison: 하위 토픽 폴더 스캔
    for await (var entry of categoryHandle.values()) {
      if (entry.kind === 'directory') {
        var topicName = entry.name;
        var topicFiles = await collectAudioFiles(entry, 'audio/simulation/' + category + '/' + topicName);
        index[category][topicName] = topicFiles;
        console.log('[audioIndexManager]', category + '/' + topicName + ':', topicFiles.length, 'files');
      }
    }
  }

  /**
   * 폴더 내 오디오 파일 수집
   * @param {FileSystemDirectoryHandle} dirHandle - 폴더 핸들
   * @param {string} basePath - 베이스 경로 (상대 경로)
   * @returns {Promise<Array<string>>} - 파일 경로 배열
   */
  async function collectAudioFiles(dirHandle, basePath) {
    var files = [];
    var audioExtensions = ['.mp3', '.m4a', '.wav', '.wma'];

    for await (var entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        var fileName = entry.name;
        var ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

        if (audioExtensions.indexOf(ext) !== -1) {
          files.push(basePath + '/' + fileName);
        }
      }
    }

    return files;
  }

  /**
   * localStorage에 인덱스 저장
   * @param {Object} index - 인덱스 객체
   */
  function saveToStorage(index) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(index));
      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
      console.log('[audioIndexManager] Index saved to localStorage');
    } catch (error) {
      console.error('[audioIndexManager] Failed to save to localStorage:', error);
      throw new Error('localStorage 저장 실패. 브라우저 저장소 용량을 확인하세요.');
    }
  }

  /**
   * localStorage에서 인덱스 로드
   * @returns {Object|null} - 인덱스 객체 또는 null
   */
  function loadFromStorage() {
    try {
      var version = localStorage.getItem(STORAGE_VERSION_KEY);
      var data = localStorage.getItem(STORAGE_KEY);

      if (!data) {
        console.log('[audioIndexManager] No index found in localStorage');
        return null;
      }

      if (version !== CURRENT_VERSION) {
        console.warn('[audioIndexManager] Index version mismatch. Expected:', CURRENT_VERSION, 'Got:', version);
        clearCache();
        return null;
      }

      var index = JSON.parse(data);
      console.log('[audioIndexManager] Index loaded from localStorage');
      return index;
    } catch (error) {
      console.error('[audioIndexManager] Failed to load from localStorage:', error);
      clearCache();
      return null;
    }
  }

  /**
   * localStorage 캐시 삭제
   */
  function clearCache() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_VERSION_KEY);
    console.log('[audioIndexManager] Cache cleared');
  }

  /**
   * 인덱스 존재 여부 확인
   * @returns {boolean}
   */
  function hasCache() {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  /**
   * 인덱스 통계 정보
   * @returns {Object|null}
   */
  function getStats() {
    var index = loadFromStorage();
    if (!index) {
      return null;
    }

    return {
      selfIntroduction: index['self-introduction'].length,
      selfAssess: index['selfAssess'].length,
      survey: Object.keys(index['survey']).length,
      nonSurvey: Object.keys(index['non-survey']).length,
      rolePlay: Object.keys(index['rolePlay']).length,
      issueComparison: Object.keys(index['issueComparison']).length
    };
  }

  // Public API
  return {
    isSupported: isSupported,
    selectAndScanFolder: selectAndScanFolder,
    loadFromStorage: loadFromStorage,
    saveToStorage: saveToStorage,
    clearCache: clearCache,
    hasCache: hasCache,
    getStats: getStats
  };
})();
