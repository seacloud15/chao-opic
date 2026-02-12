var ChaoOPIc = ChaoOPIc || {};
ChaoOPIc.data = ChaoOPIc.data || {};

ChaoOPIc.data.simulation = {
  // === 시작 화면 ===
  intro: {
    title: "Oral Proficiency Interview - computer (OPIc)",
    subtitle: "지금부터 Vietnamese 말하기 평가를 시작하겠습니다.",
    interviewer: "Mai"
  },

  // === Step 1: Background Survey (4 Parts) ===
  backgroundSurvey: [
    {
      part: 1,
      question: "현재 귀하는 어느 분야에 종사하고 계십니까?",
      type: "radio",
      options: [
        "사업/회사",
        "재택근무/재택사업",
        "교사/교육자",
        "일 경험 없음"
      ]
    },
    {
      part: 2,
      question: "현재 당신은 학생입니까?",
      type: "conditional",
      options: ["예", "아니요"],
      subQuestions: {
        "예": {
          question: "현재 어떤 강의를 듣고 있습니까?",
          options: [
            "학위 과정 수업",
            "전문 기술 향상을 위한 평생 학습",
            "어학수업"
          ]
        },
        "아니요": {
          question: "최근 어떤 강의를 수강했습니까?",
          options: [
            "학위 과정 수업",
            "전문 기술 향상을 위한 평생 학습",
            "어학수업",
            "수강 후 5년 이상 지남"
          ]
        }
      }
    },
    {
      part: 3,
      question: "현재 귀하는 어디에 살고 계십니까?",
      type: "radio",
      options: [
        "개인주택이나 아파트에 홀로 거주",
        "친구나 룸메이트와 함께 주택이나 아파트에 거주",
        "가족(배우자/자녀/기타 가족 일원)과 함께 주택이나 아파트에 거주",
        "학교 기숙사",
        "군대 막사"
      ]
    },
    {
      part: 4,
      type: "multi-checkbox",
      minTotal: 12,
      instruction: "아래의 설문에서 총 <strong>12개</strong> 이상의 항목을 선택하십시오.",
      groups: [
        {
          question: "귀하는 여가 활동으로 주로 무엇을 하십니까? (두 개 이상 선택)",
          minSelect: 2,
          options: [
            "영화보기",
            "클럽/나이트클럽 가기",
            "공연보기",
            "콘서트보기",
            "박물관가기",
            "공원가기",
            "캠핑하기",
            "해변가기",
            "스포츠 관람",
            "주거 개선"
          ]
        },
        {
          question: "귀하의 취미나 관심사는 무엇입니까? (한 개 이상 선택)",
          minSelect: 1,
          options: [
            "아이에게 책 읽어주기",
            "음악 감상하기",
            "악기 연주하기",
            "혼자 노래부르거나 합창하기",
            "춤추기",
            "글쓰기(편지, 단문, 시 등)",
            "그림 그리기",
            "요리하기",
            "애완동물 기르기"
          ]
        },
        {
          question: "귀하는 주로 어떤 운동을 즐기십니까? (한 개 이상 선택)",
          minSelect: 1,
          options: [
            "농구",
            "야구/소프트볼",
            "축구",
            "미식축구",
            "하키",
            "크리켓",
            "골프",
            "배구",
            "테니스",
            "배드민턴",
            "탁구",
            "수영",
            "자전거",
            "스키/스노우보드",
            "아이스 스케이트",
            "조깅",
            "걷기",
            "요가",
            "하이킹/트레킹",
            "낚시",
            "헬스",
            "운동을 전혀 하지 않음"
          ]
        },
        {
          question: "귀하는 어떤 휴가나 출장을 다녀온 경험이 있습니까? (한 개 이상 선택)",
          minSelect: 1,
          options: [
            "국내출장",
            "해외출장",
            "집에서 보내는 휴가",
            "국내 여행",
            "해외 여행"
          ]
        }
      ]
    }
  ],

  // === Step 2: Self Assessment (6 levels) ===
  selfAssessment: [
    { level: 1, description: "나는 10단어 이하의 단어로 말할 수 있습니다." },
    { level: 2, description: "나는 기본적인 물건, 색깔, 요일, 음식, 의류, 숫자 등을 말할 수 있습니다. 나는 항상 완벽한 문장을 구사하지는 못하고 간단한 질문도 하기 어렵습니다." },
    { level: 3, description: "나는 나 자신, 직장, 친숙한 사람과 장소, 일상에 대한 기본적인 정보를 간단한 문장으로 전달할 수 있습니다. 간단한 질문을 할 수 있습니다." },
    { level: 4, description: "나는 나 자신, 일상, 일/학교, 취미에 대해 간단한 대화를 할수 있습니다. 나는 이런 친숙한 주제와 일상에 대해 일련의 간단한 문장들을 쉽게 만들어 낼 수 있습니다. 내가 필요한 것을 얻기 위한 질문도 할수 있습니다." },
    { level: 5, description: "나는 친숙한 주제와 가정, 일/학교, 개인 및 사회적 관심사에 대해 대화할 수 있습니다. 나는 일어난 일과 일어나고 있는 일, 일어날 일에 대해 문장을 연결하여 말할 수 있습니다. 필요한 경우 설명도 할 수 있습니다. 일상 생활에서 예기치 못한 상황이 발생하더라도 임기응변으로 대처할 수 있습니다." },
    { level: 6, description: "나는 일/학교, 개인적인 관심사, 시사 문제에 대한 어떤 대화나 토론에도 자신 있게 참여할 수 있습니다. 나는 대부분의 주제에 관해 높은 수준의 정확성과 폭넓은 어휘로 상세히 설명할 수 있습니다." }
  ],

  // === Step 3: Setup ===
  setup: {
    instructions: [
      "Play 아이콘(\u25B6)을 눌러 질문을 듣고 재생 음량을 조정하십시오.",
      "마이크 점검을 위해 <span class=\"opic-btn-label start\">\uD83C\uDFA4 Start Recording</span>을 누르고 답변 후 <span class=\"opic-btn-label stop\">\u23F9 Stop Recording</span>을 눌러 녹음을 마칩니다.",
      "<span class=\"opic-btn-label play\">\u25B6 Play Recording</span>을 눌러 음성이 정상 녹음되었는지 확인하십시오."
    ]
  },

  // === Step 4: Sample Question ===
  sampleQuestion: {
    text: "H\u00E3y gi\u1EDBi thi\u1EC7u v\u1EC1 b\u1EA3n th\u00E2n b\u1EA1n.",
    translation: "자기소개를 해주세요.",
    audio: "audio/simulation/sampleQuestion/Sample Question.mp3",
    notice: "본 단계는 연습 문제 단계이며 시험 성적에는 영향을 주지 않습니다.",
    replayNotice: "Play 아이콘(\u25B6)을 눌러 질문을 청취하십시오.\n<strong>중요!</strong> 5초 이내에 버튼을 누르면 질문 다시듣기가 가능하며, 재청취는 <strong>한번만</strong> 가능합니다."
  },

  // === Step 5: Begin Test ===
  examRules: [
    {
      icon: "window",
      title: "시험화면을 벗어나지 마십시오.",
      desc: "시험 중 다른 웹사이트나 프로그램 실행 시 시험창이 자동 종료되고 로그인 화면으로 다시 이동하게 됩니다."
    },
    {
      icon: "refresh",
      title: "새로고침, 뒤로가기 금지",
      desc: "시험 중 화면을 새로고침하거나 브라우저의 뒤로가기 버튼을 누르는 경우, 시험창이 자동 종료되고 로그인 화면으로 다시 이동하게 됩니다."
    },
    {
      icon: "mic",
      title: "말하기",
      desc: "각 질문의 내용에 부합하여 최대한 자세하게 답변하되, 너무 큰소리로 말해 다른 수험자에게 방해가 되지 않도록 주의 바랍니다."
    },
    {
      icon: "clock",
      title: "시험 시간 엄수",
      desc: "시험 제한 시간은 40분입니다. 반드시 감독관의 시작 안내가 있은 후 Begin을 누르고 시험을 시작하십시오."
    }
  ],
  examWarning: "기술적인 문제 발생 시, 당황하지 마시고 즉시 감독관에게 보고 바랍니다. 재접속 시 문제가 있었던 부분부터 다시 진행하며, 추가시간을 부여합니다.",

  // === 설정 ===
  settings: {
    totalTimeMinutes: 40,
    questionsPerSession: 15,
    preparationTimeSec: 20
  },

  // === 시험 질문 풀 ===
  questions: [
    { id: "sim-01", category: "self-intro", difficulty: "IM", text: "H\u00E3y gi\u1EDBi thi\u1EC7u v\u1EC1 b\u1EA3n th\u00E2n b\u1EA1n.", translation: "자기소개를 해주세요.", audio: "audio/simulation/sim-01.mp3" },
    { id: "sim-02", category: "self-intro", difficulty: "IM", text: "B\u1EA1n s\u1ED1ng \u1EDF \u0111\u00E2u? H\u00E3y m\u00F4 t\u1EA3 n\u01A1i b\u1EA1n s\u1ED1ng.", translation: "어디에 사나요? 사는 곳을 묘사해 주세요.", audio: "audio/simulation/sim-02.mp3" },
    { id: "sim-03", category: "self-intro", difficulty: "IH", text: "H\u00E3y so s\u00E1nh cu\u1ED9c s\u1ED1ng hi\u1EC7n t\u1EA1i c\u1EE7a b\u1EA1n v\u1EDBi 5 n\u0103m tr\u01B0\u1EDBc.", translation: "현재 생활과 5년 전을 비교해 주세요.", audio: "audio/simulation/sim-03.mp3" },
    { id: "sim-04", category: "hobby", difficulty: "IM", text: "S\u1EDF th\u00EDch c\u1EE7a b\u1EA1n l\u00E0 g\u00EC? B\u1EA1n th\u01B0\u1EDDng l\u00E0m g\u00EC v\u00E0o th\u1EDDi gian r\u1EA3nh?", translation: "취미가 뭔가요? 여가 시간에 보통 뭘 하나요?", audio: "audio/simulation/sim-04.mp3" },
    { id: "sim-05", category: "hobby", difficulty: "IM", text: "B\u1EA1n c\u00F3 th\u00EDch nghe nh\u1EA1c kh\u00F4ng? B\u1EA1n th\u00EDch th\u1EC3 lo\u1EA1i nh\u1EA1c n\u00E0o?", translation: "음악 듣는 것을 좋아하나요? 어떤 장르를 좋아하나요?", audio: "audio/simulation/sim-05.mp3" },
    { id: "sim-06", category: "hobby", difficulty: "IH", text: "H\u00E3y k\u1EC3 v\u1EC1 m\u1ED9t l\u1EA7n b\u1EA1n th\u1EED m\u1ED9t s\u1EDF th\u00EDch m\u1EDBi.", translation: "새로운 취미를 시도해 본 경험을 말해 주세요.", audio: "audio/simulation/sim-06.mp3" },
    { id: "sim-07", category: "travel", difficulty: "IM", text: "B\u1EA1n th\u00EDch \u0111i du l\u1ECBch kh\u00F4ng? B\u1EA1n mu\u1ED1n \u0111i \u0111\u00E2u nh\u1EA5t?", translation: "여행을 좋아하나요? 가장 가고 싶은 곳은 어디인가요?", audio: "audio/simulation/sim-07.mp3" },
    { id: "sim-08", category: "travel", difficulty: "IH", text: "H\u00E3y k\u1EC3 v\u1EC1 m\u1ED9t v\u1EA5n \u0111\u1EC1 b\u1EA1n g\u1EB7p ph\u1EA3i khi \u0111i du l\u1ECBch.", translation: "여행 중 겪은 문제에 대해 이야기해 주세요.", audio: "audio/simulation/sim-08.mp3" },
    { id: "sim-09", category: "work", difficulty: "IM", text: "B\u1EA1n l\u00E0m ngh\u1EC1 g\u00EC? H\u00E3y m\u00F4 t\u1EA3 c\u00F4ng vi\u1EC7c h\u00E0ng ng\u00E0y.", translation: "무슨 일을 하나요? 일상 업무를 설명해 주세요.", audio: "audio/simulation/sim-09.mp3" },
    { id: "sim-10", category: "work", difficulty: "IH", text: "H\u00E3y k\u1EC3 v\u1EC1 m\u1ED9t d\u1EF1 \u00E1n kh\u00F3 kh\u0103n b\u1EA1n \u0111\u00E3 ho\u00E0n th\u00E0nh.", translation: "완료한 어려운 프로젝트에 대해 이야기해 주세요.", audio: "audio/simulation/sim-10.mp3" },
    { id: "sim-11", category: "daily", difficulty: "IL", text: "B\u1EA1n th\u01B0\u1EDDng th\u1EE9c d\u1EADy l\u00FAc m\u1EA5y gi\u1EDD?", translation: "보통 몇 시에 일어나나요?", audio: "audio/simulation/sim-11.mp3" },
    { id: "sim-12", category: "daily", difficulty: "IM", text: "H\u00E3y m\u00F4 t\u1EA3 m\u1ED9t ng\u00E0y b\u00ECnh th\u01B0\u1EDDng c\u1EE7a b\u1EA1n.", translation: "평범한 하루를 묘사해 주세요.", audio: "audio/simulation/sim-12.mp3" },
    { id: "sim-13", category: "self-intro", difficulty: "IL", text: "T\u00EAn b\u1EA1n l\u00E0 g\u00EC? B\u1EA1n bao nhi\u00EAu tu\u1ED5i?", translation: "이름이 뭔가요? 나이가 어떻게 되나요?", audio: "audio/simulation/sim-13.mp3" },
    { id: "sim-14", category: "travel", difficulty: "IM", text: "B\u1EA1n th\u00EDch du l\u1ECBch bi\u1EC3n hay du l\u1ECBch n\u00FAi h\u01A1n? T\u1EA1i sao?", translation: "바다 여행과 산 여행 중 어떤 것을 더 좋아하나요? 이유는?", audio: "audio/simulation/sim-14.mp3" },
    { id: "sim-15", category: "daily", difficulty: "IH", text: "Cu\u1ED9c s\u1ED1ng h\u00E0ng ng\u00E0y c\u1EE7a b\u1EA1n \u0111\u00E3 thay \u0111\u1ED5i th\u1EBF n\u00E0o sau \u0111\u1EA1i d\u1ECBch?", translation: "팬데믹 이후 일상이 어떻게 변했나요?", audio: "audio/simulation/sim-15.mp3" }
  ]
};
