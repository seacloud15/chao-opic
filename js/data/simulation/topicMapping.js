/**
 * ChaoOPIc - Topic Mapping
 * Survey 응답 → audio 폴더명 매핑
 *
 * 사용법:
 * - surveyTopicMap: Part 3, 4의 응답을 audio/simulation/survey 폴더명으로 변환
 * - 응답값이 배열인 경우, 런타임에 랜덤 선택
 */

var ChaoOPIc = ChaoOPIc || {};
ChaoOPIc.data = ChaoOPIc.data || {};

ChaoOPIc.data.topicMapping = {
  /**
   * Survey 응답 → audio/simulation/survey 폴더명 매핑
   * 값이 배열인 경우: 여러 폴더 중 랜덤 선택
   */
  surveyTopicMap: {
    // === Part 3: 거주 형태 ===
    '개인주택이나 아파트에 홀로 거주': [
      '00. 독신거주',
      '00. 아파트 혼자 거주 (띠엔 25.01.26)'
    ],
    '친구나 룸메이트와 함께 주택이나 아파트에 거주': null, // 미구현
    '가족(배우자/자녀/기타 가족 일원)과 함께 주택이나 아파트에 거주': null, // 미구현
    '학교 기숙사': null, // 미구현
    '군대 막사': null, // 미구현

    // === Part 4: 여가 활동 ===
    '영화보기': '06. XEM PHIM',
    '클럽/나이트클럽 가기': null, // 미구현
    '공연보기': '05. 공연보기',
    '콘서트보기': '04. 콘서트보기',
    '박물관가기': null, // 미구현
    '공원가기': [
      '01. 공원가기',
      '01. ĐI CÔNG VIÊN',
      '01. 공원 (띠엔 25.01.26)'
    ],
    '캠핑하기': null, // 미구현
    '해변가기': [
      '02. 해변가기',
      '02. ĐI BIỂN'
    ],
    '스포츠 관람': null, // 미구현
    '주거 개선': null, // 미구현

    // === Part 4: 취미/관심사 ===
    '아이에게 책 읽어주기': null, // 미구현
    '음악 감상하기': [
      '03. 음악감상하기',
      '03. NGHE NHẠC',
      '03. 음악 (띠엔 25.01.26)'
    ],
    '악기 연주하기': null, // 미구현
    '혼자 노래부르거나 합창하기': null, // 미구현
    '춤추기': null, // 미구현
    '글쓰기(편지, 단문, 시 등)': null, // 미구현
    '그림 그리기': null, // 미구현
    '요리하기': null, // 미구현
    '애완동물 기르기': null, // 미구현

    // === Part 4: 운동 ===
    '농구': null, // 미구현
    '야구/소프트볼': null, // 미구현
    '축구': null, // 미구현
    '미식축구': null, // 미구현
    '하키': null, // 미구현
    '크리켓': null, // 미구현
    '골프': null, // 미구현
    '배구': null, // 미구현
    '테니스': null, // 미구현
    '배드민턴': null, // 미구현
    '탁구': null, // 미구현
    '수영': null, // 미구현
    '자전거': null, // 미구현
    '스키/스노우보드': null, // 미구현
    '아이스 스케이트': null, // 미구현
    '조깅': '07. 조깅',
    '걷기': '08. ĐI BỘ- CHẠY BỘ',
    '요가': null, // 미구현
    '하이킹/트레킹': null, // 미구현
    '낚시': null, // 미구현
    '헬스': null, // 미구현
    '운동을 전혀 하지 않음': null, // 미구현

    // === Part 4: 휴가/출장 ===
    '국내출장': null, // 미구현
    '해외출장': null, // 미구현
    '집에서 보내는 휴가': '11. Ở NHÀ VÀO KỲ NGHỈ',
    '국내 여행': [
      '10. 국내여행',
      '10. DU LỊCH TRONG NƯỚC'
    ],
    '해외 여행': [
      '09. 해외여행',
      '09. DU LỊCH NƯỚC NGOÀI'
    ]
  },

  /**
   * non-survey 토픽 목록 (문제 8,9,10번과 14,15번에 사용)
   */
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

  /**
   * rolePlay 토픽 목록 (문제 11,12,13번에 사용)
   */
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
  ],

  /**
   * Survey 응답에서 폴더명 추출 (배열인 경우 랜덤 선택)
   * @param {string} surveyAnswer - Survey 응답 (예: "영화보기")
   * @returns {string|null} - 폴더명 또는 null
   */
  getFolderName: function(surveyAnswer) {
    var mapped = this.surveyTopicMap[surveyAnswer];

    if (!mapped) {
      return null;
    }

    // 배열인 경우 랜덤 선택
    if (Array.isArray(mapped)) {
      var randomIndex = Math.floor(Math.random() * mapped.length);
      return mapped[randomIndex];
    }

    return mapped;
  }
};
