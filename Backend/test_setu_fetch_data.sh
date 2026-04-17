#!/bin/bash

################################################################################
# SETU API - Fetch Transaction Data
# Run this after consent has been approved in the SETU UI
################################################################################

set -e

BASE_URL="http://localhost:8000/api/v1/setu"
DATE_FROM="2024-04-16T00:00:00Z"
DATE_TO="2025-04-15T23:59:59Z"

# Use passed CONSENT_ID or exit
if [ -z "$CONSENT_ID" ]; then
  echo "❌ Error: CONSENT_ID not provided"
  echo ""
  echo "Usage:"
  echo "  CONSENT_ID=\"550e8400-e29b-41d4-a716-446655440000\" bash test_setu_fetch_data.sh"
  exit 1
fi

echo "==============================================="
echo "SETU API - Fetch Transaction Data"
echo "==============================================="
echo "Base URL: $BASE_URL"
echo "Consent ID: $CONSENT_ID"
echo "Date Range: $DATE_FROM to $DATE_TO"
echo ""

# ============================================================================
# STEP 1: Create Data Fetch Session
# ============================================================================
echo "📌 STEP 1: Creating Data Fetch Session..."
echo ""

FETCH_RESPONSE=$(curl -s -X POST $BASE_URL/consents/$CONSENT_ID/data-fetch \
  -H "Content-Type: application/json" \
  -d "{
    \"consentId\": \"$CONSENT_ID\",
    \"dataRange\": {
      \"from\": \"$DATE_FROM\",
      \"to\": \"$DATE_TO\"
    },
    \"format\": \"json\"
  }")

echo "Response:"
echo "$FETCH_RESPONSE" | jq '.'
echo ""

SESSION_ID=$(echo "$FETCH_RESPONSE" | jq -r '.session_id // empty')
FETCH_STATUS=$(echo "$FETCH_RESPONSE" | jq -r '.status // empty')

if [ -z "$SESSION_ID" ]; then
  echo "❌ Failed to create data fetch session!"
  exit 1
fi

echo "✅ Session Created"
echo "   Session ID: $SESSION_ID"
echo "   Status: $FETCH_STATUS"
echo ""

# ============================================================================
# STEP 2: Poll for Transaction Data (with timeout)
# ============================================================================
echo "📌 STEP 2: Fetching Transaction Data..."
echo ""

MAX_RETRIES=30
RETRY_DELAY=2
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  echo "⏳ Polling... (attempt $((RETRY_COUNT + 1))/$MAX_RETRIES)"
  
  DATA_RESPONSE=$(curl -s -X GET "$BASE_URL/sessions/$SESSION_ID" \
    -H "Content-Type: application/json")
  
  DATA_STATUS=$(echo "$DATA_RESPONSE" | jq -r '.status // empty')
  
  if [ "$DATA_STATUS" = "COMPLETED" ]; then
    echo "✅ Data fetch completed!"
    echo ""
    echo "📊 Transaction Data:"
    echo "$DATA_RESPONSE" | jq '.'
    
    # Extract transaction count
    TRANSACTION_COUNT=$(echo "$DATA_RESPONSE" | jq -r '.data.accounts[0].transactions | length' 2>/dev/null || echo "0")
    echo ""
    echo "📈 Summary:"
    echo "   Total Transactions Fetched: $TRANSACTION_COUNT"
    echo ""
    exit 0
    
  elif [ "$DATA_STATUS" = "FAILED" ]; then
    echo "❌ Data fetch failed!"
    echo "$DATA_RESPONSE" | jq '.'
    exit 1
  fi
  
  echo "   Current Status: $DATA_STATUS"
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
    sleep $RETRY_DELAY
  fi
done

echo ""
echo "⏱️  Timeout: Data fetch did not complete within $((MAX_RETRIES * RETRY_DELAY)) seconds"
echo ""
echo "Manually check status with:"
echo "  curl -s -X GET \"$BASE_URL/sessions/$SESSION_ID\" | jq '.'"
echo ""
exit 1
