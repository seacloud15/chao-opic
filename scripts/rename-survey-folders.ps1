# Survey 폴더 이름 일괄 변경 스크립트
# 기존 폴더 -> {Survey답변}_01 형식으로 변경

$surveyPath = "audio\simulation\survey"

# 매핑 테이블: 기존 폴더명 -> 새 폴더명
$folderMapping = @{
    # Part 3: 거주 형태
    "00. 독신거주" = "개인주택이나 아파트에 홀로 거주_01"
    "00. 아파트 혼자 거주 (띠엔 25.01.26)" = "개인주택이나 아파트에 홀로 거주_02"

    # Part 4 - 여가: 공원가기 (중복)
    "01. ĐI CÔNG VIÊN" = "공원가기_01"
    "01. 공원 (띠엔 25.01.26)" = "공원가기_02"
    "01. 공원가기" = "공원가기_03"

    # Part 4 - 여가: 해변가기 (중복)
    "02. ĐI BIỂN" = "해변가기_01"
    "02. 해변가기" = "해변가기_02"

    # Part 4 - 취미: 음악 감상하기 (중복)
    "03. NGHE NHẠC" = "음악 감상하기_01"
    "03. 음악 (띠엔 25.01.26)" = "음악 감상하기_02"
    "03. 음악감상하기" = "음악 감상하기_03"

    # Part 4 - 여가: 콘서트보기
    "04. 콘서트보기" = "콘서트보기_01"

    # Part 4 - 여가: 공연보기
    "05. 공연보기" = "공연보기_01"

    # Part 4 - 여가: 영화보기 (중복)
    "06. XEM PHIM" = "영화보기_01"
    "06. 영화보기" = "영화보기_02"

    # Part 4 - 운동: 조깅
    "07. 조깅" = "조깅_01"

    # Part 4 - 운동: 걷기
    "08. ĐI BỘ- CHẠY BỘ" = "걷기_01"

    # Part 4 - 휴가: 해외 여행 (중복)
    "09. DU LỊCH NƯỚC NGOÀI" = "해외 여행_01"
    "09. 해외여행" = "해외 여행_02"
    "DU LỊCH NƯỚC NGOÀI" = "해외 여행_03"

    # Part 4 - 휴가: 국내 여행 (중복)
    "10. DU LỊCH TRONG NƯỚC" = "국내 여행_01"
    "10. 국내여행" = "국내 여행_02"

    # Part 4 - 휴가: 집에서 보내는 휴가
    "11. Ở NHÀ VÀO KỲ NGHỈ" = "집에서 보내는 휴가_01"
}

# 현재 디렉토리 저장
$currentDir = Get-Location

# 폴더 이름 변경 실행
Write-Host "===== Survey 폴더 이름 변경 시작 =====" -ForegroundColor Cyan
Write-Host "대상 경로: $surveyPath" -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($oldName in $folderMapping.Keys) {
    $newName = $folderMapping[$oldName]
    $oldPath = Join-Path $surveyPath $oldName
    $newPath = Join-Path $surveyPath $newName

    if (Test-Path $oldPath) {
        try {
            Rename-Item -Path $oldPath -NewName $newName -ErrorAction Stop
            Write-Host "✓ '$oldName' -> '$newName'" -ForegroundColor Green
            $successCount++
        }
        catch {
            Write-Host "✗ '$oldName' 변경 실패: $($_.Exception.Message)" -ForegroundColor Red
            $failCount++
        }
    }
    else {
        Write-Host "⊗ '$oldName' 폴더를 찾을 수 없습니다" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "===== 변경 완료 =====" -ForegroundColor Cyan
Write-Host "성공: $successCount 개" -ForegroundColor Green
Write-Host "실패: $failCount 개" -ForegroundColor Red
Write-Host ""
Write-Host "다음 단계: node scripts/generateAudioIndex.js 실행" -ForegroundColor Yellow
