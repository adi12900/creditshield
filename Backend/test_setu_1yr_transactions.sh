#!/bin/bash

################################################################################
# SETU API - 1-Year Transaction Testing Script
# This script tests the Setu Account Aggregator API integration
################################################################################

set -e

BASE_URL="http://localhost:8000/api/v1/setu"
VUA="9999999999@onemoney"
DATE_FROM="2024-04-16T00:00:00Z"  # 1 year ago from April 16, 2025
DATE_TO="2025-04-15T23:59:59Z"    # Up to today

echo "==============================================="
echo "SETU API - 1 Year Transaction History Test"
echo "==============================================="
echo "Base URL: $BASE_URL"
echo "VUA: $VUA"
echo "Date Range: $DATE_FROM to $DATE_TO"
echo ""

# ============================================================================
# STEP 1: Generate Access Token
# ============================================================================
echo "📌 STEP 1: Generating Access Token..."
echo ""

TOKEN_RESPONSE=$(curl -s -X POST $BASE_URL/token \
  -H "Content-Type: application/json" \
  -d '{
    "force_refresh": false
  }')

echo "Response:"
echo "$TOKEN_RESPONSE" | jq '.'
echo ""

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token // empty')
EXPIRES_AT=$(echo "$TOKEN_RESPONSE" | jq -r '.expires_at // empty')

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Failed to generate token!"
  exit 1
fi

echo "✅ Token Generated Successfully"
echo "   Token expires at: $EXPIRES_AT"
echo ""

# ============================================================================
# STEP 2: Create Consent Request for 1-Year Transactions
# ============================================================================
echo "📌 STEP 2: Creating Consent Request..."
echo ""

CONSENT_RESPONSE=$(curl -s -X POST $BASE_URL/consents \
  -H "Content-Type: application/json" \
  -d "{
    \"vua\": \"$VUA\",
    \"dataRange\": {
      \"from\": \"$DATE_FROM\",
      \"to\": \"$DATE_TO\"
    },
    \"fiTypes\": [\"DEPOSIT\"],
    \"consentTypes\": [\"PROFILE\", \"SUMMARY\", \"TRANSACTIONS\"],
    \"consentDuration\": {
      \"unit\": \"MONTH\",
      \"value\": 12
    },
    \"purpose\": {
      \"code\": \"103\",
      \"text\": \"Loan underwriting\",
      \"refUri\": \"https://api.rebit.org.in/aa/purpose/103.xml\",
      \"category\": {
        \"type\": \"LOAN\"
      }
    }
  }")

echo "Response:"
echo "$CONSENT_RESPONSE" | jq '.'
echo ""

CONSENT_ID=$(echo "$CONSENT_RESPONSE" | jq -r '.id // empty')
CONSENT_URL=$(echo "$CONSENT_RESPONSE" | jq -r '.url // empty')
CONSENT_STATUS=$(echo "$CONSENT_RESPONSE" | jq -r '.status // empty')

if [ -z "$CONSENT_ID" ]; then
  echo "❌ Failed to create consent!"
  exit 1
fi

echo "✅ Consent Created Successfully"
echo "   Consent ID: $CONSENT_ID"
echo "   Status: $CONSENT_STATUS"
echo ""

# ============================================================================
# STEP 3: User Action Required
# ============================================================================
echo "📌 STEP 3: User Approval Required"
echo ""
echo "⚠️  ACTION REQUIRED:"
echo ""
echo "1. Open this URL in your browser:"
echo "   $CONSENT_URL"
echo ""
echo "2. Approve the consent request"
echo ""
echo "3. Once approved, run the following command to fetch data:"
echo ""
echo "   CONSENT_ID=\"$CONSENT_ID\" bash test_setu_fetch_data.sh"
echo ""
echo "Or manually fetch using:"
echo ""
echo "   curl -X POST $BASE_URL/consents/$CONSENT_ID/data-fetch \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d \"{\\"
echo "       \\\"consentId\\\": \\\"$CONSENT_ID\\\",\\"
echo "       \\\"dataRange\\\": {\\"
echo "         \\\"from\\\": \\\"$DATE_FROM\\\",\\"
echo "         \\\"to\\\": \\\"$DATE_TO\\\"\\"
echo "       },\\"
echo "       \\\"format\\\": \\\"json\\\"\\"
echo "     }\""
echo ""
echo "==============================================="
