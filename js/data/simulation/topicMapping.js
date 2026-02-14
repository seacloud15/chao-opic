/**
 * ChaoOPIc - Topic Mapping (Deprecated)
 *
 * 이 파일은 더 이상 사용되지 않습니다.
 * Survey 폴더명은 이제 Survey 답변과 동일하며 ({답변}_01, {답변}_02 형식),
 * fileScanner.js가 동적으로 폴더를 찾습니다.
 *
 * 이 파일은 하위 호환성을 위해 유지되며, 유틸리티 함수만 포함합니다.
 */

var ChaoOPIc = ChaoOPIc || {};
ChaoOPIc.data = ChaoOPIc.data || {};

ChaoOPIc.data.topicMapping = {
  /**
   * 폴더명 패턴 검증 (유틸리티)
   * @param {string} folderName - 폴더명
   * @returns {boolean} - {답변}_XX 형식인지 여부
   */
  validateFolderName: function(folderName) {
    return /^.+_\d{2}$/.test(folderName);
  },

  /**
   * 폴더명에서 베이스 이름 추출 (유틸리티)
   * @param {string} folderName - 폴더명 (예: "영화보기_01")
   * @returns {string} - 베이스 이름 (예: "영화보기")
   */
  getBaseName: function(folderName) {
    var match = folderName.match(/^(.+)_\d{2}$/);
    return match ? match[1] : folderName;
  }
};
