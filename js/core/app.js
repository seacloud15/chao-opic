/**
 * ChaoOPIc - App Initialization
 * 전역 네임스페이스 설정 및 앱 초기화
 */
var ChaoOPIc = ChaoOPIc || {};

ChaoOPIc.config = {
  version: '1.0.0',
  storagePrefix: 'chaoopic-',
  debug: false
};

ChaoOPIc.core = {};
ChaoOPIc.data = { topics: {}, vocabulary: {}, simulation: {} };
ChaoOPIc.pages = {};
