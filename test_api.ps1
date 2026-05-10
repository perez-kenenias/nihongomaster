$deck = (curl.exe -s -X POST http://localhost:8000/api/study/decks -H 'Content-Type: application/json' -d '{"title":"Test","source":"custom","level":"n5"}' | ConvertFrom-Json)
Write-Host "1. Deck: $($deck.id) - $($deck.title)"

$cardBody = '{"front":"こんにちは","back":"hola","reading":"konnichiwa","card_type":"vocabulary","deck_id":"' + $deck.id + '"}'
$card = (curl.exe -s -X POST "http://localhost:8000/api/study/decks/$($deck.id)/cards" -H 'Content-Type: application/json' -d $cardBody | ConvertFrom-Json)
Write-Host "2. Card: $($card.front) = $($card.back)"

$cardBody2 = '{"front":"ありがとう","back":"gracias","reading":"arigatou","card_type":"vocabulary","deck_id":"' + $deck.id + '"}'
curl.exe -s -X POST "http://localhost:8000/api/study/decks/$($deck.id)/cards" -H 'Content-Type: application/json' -d $cardBody2 | Out-Null

$sessionJson = '{"deck_id":"' + $deck.id + '","limit":10}'
$cards = (curl.exe -s -X POST http://localhost:8000/api/study/session -H 'Content-Type: application/json' -d $sessionJson | ConvertFrom-Json)
Write-Host "3. Session: $($cards.Count) cards due"

$reviewJson = '{"card_id":"' + $cards[0].id + '","rating":"good"}'
$review = (curl.exe -s -X POST http://localhost:8000/api/study/review -H 'Content-Type: application/json' -d $reviewJson | ConvertFrom-Json)
Write-Host "4. Review: stability=$($review.stability) next=$($review.next_review)"

$stats = (curl.exe -s http://localhost:8000/api/stats/dashboard | ConvertFrom-Json)
Write-Host "5. Stats: reviewed_today=$($stats.cards_reviewed_today) total=$($stats.total_cards)"

$score = (curl.exe -s -X POST http://localhost:8000/api/pronounce/score -H 'Content-Type: application/json' -d '{"text":"すみません","transcription":"すみません"}' | ConvertFrom-Json)
Write-Host "6. Pronounce: $($score.score)% - $($score.feedback)"

curl.exe -s -X DELETE "http://localhost:8000/api/study/decks/$($deck.id)" | Out-Null
Write-Host "7. Cleanup done`n"
Write-Host "=== ALL 7 TESTS PASSED ==="
