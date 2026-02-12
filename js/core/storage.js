/**
 * ChaoOPIc - Storage Module
 * localStorage 래퍼 (JSON 직렬화/역직렬화 포함)
 */
ChaoOPIc.core.storage = (function() {
  var PREFIX = ChaoOPIc.config.storagePrefix;

  return {
    get: function(key) {
      try {
        var raw = localStorage.getItem(PREFIX + key);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        console.warn('[Storage] Parse error for key:', key, e);
        return null;
      }
    },

    set: function(key, value) {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.warn('[Storage] Save error for key:', key, e);
        ChaoOPIc.core.ui.showToast('저장 공간이 부족합니다.', 'error');
        return false;
      }
    },

    remove: function(key) {
      localStorage.removeItem(PREFIX + key);
    },

    clear: function() {
      var keysToRemove = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(PREFIX) === 0) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(function(k) {
        localStorage.removeItem(k);
      });
    }
  };
})();
