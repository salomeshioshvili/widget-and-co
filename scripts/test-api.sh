#!/usr/bin/env bash
# Integration test script — requires server running with valid .env
set -euo pipefail

BASE="${1:-http://localhost:3000}"

echo "=== Health ==="
curl -sf "$BASE/health" | jq .

echo ""
echo "=== Product Types ==="
curl -sf "$BASE/api/product-types" | jq 'map(.id)'

echo ""
echo "=== 1. Chatbot ==="
BOT1=$(curl -sf -X POST "$BASE/api/bots" \
  -H "Content-Type: application/json" \
  -d '{"name":"Curl Chatbot","product_type":"chatbot","config":{"businessName":"Acme Coffee","businessInfo":"Open Mon-Fri 9am-5pm. We sell espresso and pastries.","tone":"friendly"}}')
echo "$BOT1" | jq .
ID1=$(echo "$BOT1" | jq -r .botId)
curl -sf -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d "{\"botId\":\"$ID1\",\"message\":\"What are your hours?\"}" | jq .

echo ""
echo "=== 2. Quiz ==="
BOT2=$(curl -sf -X POST "$BASE/api/bots" \
  -H "Content-Type: application/json" \
  -d '{"name":"Curl Quiz","product_type":"quiz","config":{"products":[{"name":"Light Moisturizer","description":"For oily skin"},{"name":"Rich Cream","description":"For dry skin"}],"goal":"Find the right skincare product"}}')
ID2=$(echo "$BOT2" | jq -r .botId)
curl -sf -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d "{\"botId\":\"$ID2\",\"message\":\"I have dry skin in winter\"}" | jq .

echo ""
echo "=== 3. Lead Qualifier ==="
BOT3=$(curl -sf -X POST "$BASE/api/bots" \
  -H "Content-Type: application/json" \
  -d '{"name":"Curl Lead","product_type":"lead_qualifier","config":{"qualifyingQuestions":["What is your budget?","When do you need this?"]}}')
ID3=$(echo "$BOT3" | jq -r .botId)
curl -sf -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d "{\"botId\":\"$ID3\",\"message\":\"We need a solution ASAP, budget around $50k\"}" | jq .

echo ""
echo "=== 4. FAQ Search ==="
BOT4=$(curl -sf -X POST "$BASE/api/bots" \
  -H "Content-Type: application/json" \
  -d '{"name":"Curl FAQ","product_type":"faq_search","config":{"faqs":[{"question":"What is your return policy?","answer":"Returns accepted within 30 days with receipt."},{"question":"Do you ship internationally?","answer":"Yes, we ship to most countries."}]}}')
ID4=$(echo "$BOT4" | jq -r .botId)
curl -sf -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d "{\"botId\":\"$ID4\",\"message\":\"Can I return something?\"}" | jq .

echo ""
echo "=== 5. Review Summarizer ==="
BOT5=$(curl -sf -X POST "$BASE/api/bots" \
  -H "Content-Type: application/json" \
  -d '{"name":"Curl Reviews","product_type":"review_summarizer","config":{"reviews":["Great product, fast shipping!","Okay quality but slow delivery.","Absolutely love it, best purchase ever."]}}')
ID5=$(echo "$BOT5" | jq -r .botId)
curl -sf -X POST "$BASE/api/build" \
  -H "Content-Type: application/json" \
  -d "{\"botId\":\"$ID5\"}" | jq .
curl -sf "$BASE/api/bots/$ID5" | jq '.config.summary'

echo ""
echo "=== Messages (chatbot) ==="
curl -sf "$BASE/api/bots/$ID1/messages" | jq 'length'

echo ""
echo "All tests passed."
