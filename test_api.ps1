# NihongoMaster API Tests
# Usage: powershell -ExecutionPolicy Bypass -File test_api.ps1
# Uses Invoke-RestMethod for proper UTF-8/JSON handling in PowerShell 5.1

$BASE = "http://localhost:8000/api"
$pass = 0
$fail = 0

function test($name, $script) {
    try {
        & $script | Out-Null
        Write-Host "  PASS  $name" -ForegroundColor Green
        $global:pass++
    } catch {
        Write-Host "  FAIL  $name : $_" -ForegroundColor Red
        $global:fail++
    }
}

Write-Host "`n=== NihongoMaster API Test Suite ===`n"

# 1. Create deck
$deck = $null
test "POST /api/study/decks" {
    $body = @{title="Test"; source="custom"; level="n5"} | ConvertTo-Json -Compress
    $script:deck = Invoke-RestMethod -Uri "$BASE/study/decks" -Method Post -Body $body -ContentType "application/json"
    if (-not $script:deck.id) { throw "No deck id returned" }
    Write-Host "         Deck: $($script:deck.id) - $($script:deck.title)"
}

# 2. Add card
$card = $null
test "POST /api/study/decks/{id}/cards" {
    $body = @{
        front="konnichiha"; back="hola"; reading="konnichiwa"
        card_type="vocabulary"; deck_id=$deck.id
    } | ConvertTo-Json -Compress
    $script:card = Invoke-RestMethod -Uri "$BASE/study/decks/$($deck.id)/cards" -Method Post -Body $body -ContentType "application/json"
    if ($script:card.front -ne "konnichiha") { throw "Wrong card data" }
    Write-Host "         Card: $($script:card.front) = $($script:card.back)"
}

# 3. Add second card
test "POST /api/study/decks/{id}/cards (2)" {
    $body = @{
        front="arigatou"; back="gracias"; reading="arigatou"
        card_type="vocabulary"; deck_id=$deck.id
    } | ConvertTo-Json -Compress
    $c2 = Invoke-RestMethod -Uri "$BASE/study/decks/$($deck.id)/cards" -Method Post -Body $body -ContentType "application/json"
    if (-not $c2.id) { throw "No card id returned" }
}

# 4. Start session
$cards = $null
test "POST /api/study/session" {
    $body = @{deck_id=$deck.id; limit=10} | ConvertTo-Json -Compress
    $script:cards = Invoke-RestMethod -Uri "$BASE/study/session" -Method Post -Body $body -ContentType "application/json"
    if ($script:cards.Count -lt 1) { throw "No cards in session" }
    Write-Host "         Cards in session: $($script:cards.Count)"
}

# 5. Review card
test "POST /api/study/review" {
    $body = @{card_id=$cards[0].id; rating="good"} | ConvertTo-Json -Compress
    $review = Invoke-RestMethod -Uri "$BASE/study/review" -Method Post -Body $body -ContentType "application/json"
    if (-not $review.next_review) { throw "No next_review returned" }
    Write-Host "         Stability: $($review.stability)  Next: $($review.next_review)"
}

# 6. Stats dashboard
test "GET /api/stats/dashboard" {
    $stats = Invoke-RestMethod -Uri "$BASE/stats/dashboard"
    if ($null -eq $stats.total_cards) { throw "No total_cards" }
    Write-Host "         Reviewed today: $($stats.cards_reviewed_today)  Total: $($stats.total_cards)"
}

# 7. Pronunciation scoring
test "POST /api/pronounce/score" {
    $body = @{text="sumimasen"; transcription="sumimasen"} | ConvertTo-Json -Compress
    $score = Invoke-RestMethod -Uri "$BASE/pronounce/score" -Method Post -Body $body -ContentType "application/json"
    if ($null -eq $score.score) { throw "No score returned" }
    Write-Host "         Score: $($score.score)%  Feedback: $($score.feedback)"
}

# 8. Curriculum books
test "GET /api/curriculum/books" {
    $books = Invoke-RestMethod -Uri "$BASE/curriculum/books"
    if ($books.Count -ne 3) { throw "Expected 3 books, got $($books.Count)" }
    Write-Host "         Books: $($books.Count)"
}

# 9. Book detail
test "GET /api/curriculum/books/genki_i" {
    $book = Invoke-RestMethod -Uri "$BASE/curriculum/books/genki_i"
    if (-not $book.title) { throw "No book title" }
}

# 10. Lesson detail
test "GET /api/curriculum/books/genki_i/lessons/genki1_l01" {
    $lesson = Invoke-RestMethod -Uri "$BASE/curriculum/books/genki_i/lessons/genki1_l01"
    if ($lesson.vocabulary.Count -eq 0) { throw "No vocabulary" }
    Write-Host "         Vocabulary: $($lesson.vocabulary.Count)  Sentences: $($lesson.sentences.Count)"
}

# 11. Scenarios list
test "GET /api/chat/scenarios" {
    $scenarios = Invoke-RestMethod -Uri "$BASE/chat/scenarios"
    if ($scenarios.Count -ne 8) { throw "Expected 8 scenarios, got $($scenarios.Count)" }
    Write-Host "         Scenarios: $($scenarios.Count)"
}

# 12. Scenario detail
test "GET /api/chat/scenarios/restaurant" {
    $s = Invoke-RestMethod -Uri "$BASE/chat/scenarios/restaurant"
    if (-not $s.title) { throw "No scenario title" }
}

# 13. Health check
test "GET /api/health" {
    $h = Invoke-RestMethod -Uri "$BASE/health"
    if ($h.status -ne "ok") { throw "Health not ok" }
}

# Cleanup
test "DELETE /api/study/decks/{id}" {
    Invoke-RestMethod -Uri "$BASE/study/decks/$($deck.id)" -Method Delete | Out-Null
}

Write-Host "`n=== Results: $pass passed, $fail failed ==="
if ($fail -gt 0) { exit 1 } else { exit 0 }
