# SETU API - 1-Year Transactions Testing via cURL

## Setup & Prerequisites

Before running the curl commands, ensure:

1. **Backend is running:**
   ```bash
   cd /media/ideabliss/E0921B6E921B4904/creditshield/Backend
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

2. **Environment Variables Configured** in `.env`:
   ```
   SETU_CLIENT_ID=your-client-id
   SETU_CLIENT_SECRET=your-client-secret
   SETU_PRODUCT_INSTANCE_ID=your-product-instance-id
   ```

3. **Base URL:**
   ```bash
   BASE_URL="http://localhost:8000/api/v1/setu"
   ```

---

## Step 1: Generate Access Token

```bash
curl -X POST http://localhost:8000/api/v1/setu/token \
  -H "Content-Type: application/json" \
  -d '{
    "force_refresh": false
  }' | jq '.'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "expires_at": "2026-04-16T20:00:00Z"
}
```

**Store token for next steps:**
```bash
ACCESS_TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/setu/token \
  -H "Content-Type: application/json" \
  -d '{"force_refresh": false}' | jq -r '.access_token')

echo "Token: $ACCESS_TOKEN"
```

---

## Step 2: Create Consent for 1-Year Transactions

Create a consent request for **12 months of transaction data**.

### For 1 Year (12 Months) - Last 12 Months

```bash
BASE_URL="http://localhost:8000/api/v1/setu"

curl -X POST $BASE_URL/consents \
  -H "Content-Type: application/json" \
  -d '{
    "vua": "9999999999@onemoney",
    "dataRange": {
      "from": "2024-04-16T00:00:00Z",
      "to": "2025-04-15T23:59:59Z"
    },
    "fiTypes": ["DEPOSIT"],
    "consentTypes": ["PROFILE", "SUMMARY", "TRANSACTIONS"],
    "consentDuration": {
      "unit": "MONTH",
      "value": 12
    },
    "purpose": {
      "code": "103",
      "text": "Loan underwriting",
      "refUri": "https://www.setu.co/purpose",
      "category": {
        "type": "LOAN"
      }
    }
  }' | jq '.'
```

### For Current Year (Calendar Year)

```bash
BASE_URL="http://localhost:8000/api/v1/setu"

curl -X POST $BASE_URL/consents \
  -H "Content-Type: application/json" \
  -d '{
    "vua": "9999999999@onemoney",
    "dataRange": {
      "from": "2025-01-01T00:00:00Z",
      "to": "2025-12-31T23:59:59Z"
    },
    "fiTypes": ["DEPOSIT"],
    "consentTypes": ["PROFILE", "SUMMARY", "TRANSACTIONS"],
    "consentDuration": {
      "unit": "MONTH",
      "value": 12
    },
    "purpose": {
      "code": "103",
      "text": "Loan underwriting",
      "refUri": "https://www.setu.co/purpose",
      "category": {
        "type": "LOAN"
      }
    }
  }' | jq '.'
```

**Expected Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://aa-sandbox.setu.co/consent/550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING",
  "txnid": "txn_550e8400"
}
```

**⚠️ ACTION REQUIRED**: Visit the `url` to approve the consent in the SETU interface.

**Store Consent ID for next step:**
```bash
CONSENT_ID="550e8400-e29b-41d4-a716-446655440000"  # Copy from response above
echo "Consent ID: $CONSENT_ID"
```

---

## Step 3: Create Data Fetch Session

After consent is approved (may take a few seconds), create a session to fetch the data.

```bash
BASE_URL="http://localhost:8000/api/v1/setu"
CONSENT_ID="550e8400-e29b-41d4-a716-446655440000"

curl -X POST $BASE_URL/consents/$CONSENT_ID/data-fetch \
  -H "Content-Type: application/json" \
  -d '{
    "consentId": "'$CONSENT_ID'",
    "dataRange": {
      "from": "2024-04-16T00:00:00Z",
      "to": "2025-04-15T23:59:59Z"
    },
    "format": "json"
  }' | jq '.'
```

**Expected Response:**
```json
{
  "session_id": "sess_550e8400-e29b-41d4-a716",
  "consent_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING",
  "txnid": "txn_data_fetch"
}
```

**Store Session ID:**
```bash
SESSION_ID="sess_550e8400-e29b-41d4-a716"  # Copy from response
echo "Session ID: $SESSION_ID"
```

---

## Step 4: Poll for Transaction Data

Once the session is created, poll the endpoint until data is ready (status: COMPLETED).

### Single Poll:

```bash
BASE_URL="http://localhost:8000/api/v1/setu"
SESSION_ID="sess_550e8400-e29b-41d4-a716"

curl -X GET $BASE_URL/sessions/$SESSION_ID \
  -H "Content-Type: application/json" | jq '.'
```

### Polling Script (Auto-retry every 3 seconds):

```bash
#!/bin/bash

BASE_URL="http://localhost:8000/api/v1/setu"
SESSION_ID="sess_550e8400-e29b-41d4-a716"
MAX_ATTEMPTS=20
ATTEMPT=0

echo "Starting poll for session: $SESSION_ID"

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  RESPONSE=$(curl -s -X GET $BASE_URL/sessions/$SESSION_ID)
  STATUS=$(echo $RESPONSE | jq -r '.status')
  
  echo "[$((ATTEMPT+1))/$MAX_ATTEMPTS] Status: $STATUS"
  
  if [ "$STATUS" = "COMPLETED" ]; then
    echo "✅ Data fetched successfully!"
    echo $RESPONSE | jq '.'
    break
  elif [ "$STATUS" = "FAILED" ]; then
    echo "❌ Data fetch failed!"
    echo $RESPONSE | jq '.'
    break
  fi
  
  sleep 3
  ATTEMPT=$((ATTEMPT+1))
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo "⏱️ Max attempts reached. Session may still be processing."
fi
```

### Expected Response (Status: COMPLETED):

```json
{
  "id": "sess_550e8400-e29b-41d4-a716",
  "status": "COMPLETED",
  "consentId": "550e8400-e29b-41d4-a716-446655440000",
  "dataRange": {
    "from": "2024-04-16T00:00:00Z",
    "to": "2025-04-15T23:59:59Z"
  },
  "format": "json",
  "fips": [
    {
      "fipID": "HDFC0000001",
      "accounts": [
        {
          "maskedAccNumber": "XXXXX1234",
          "linkRefNumber": "abc123def456",
          "fiType": "DEPOSIT",
          "data": {
            "type": "deposit",
            "account": {
              "linkedAccRef": "abc123def456",
              "maskedAccNumber": "XXXXX1234",
              "type": "SAVINGS",
              "summary": {
                "currentBalance": "500000",
                "currency": "INR",
                "balanceDateTime": "2025-04-13T10:00:00Z"
              },
              "transactions": [
                {
                  "txnId": "txn_001",
                  "amount": "50000",
                  "type": "CREDIT",
                  "narration": "Salary",
                  "transactionTimestamp": "2025-04-10T14:00:00Z",
                  "currentBalance": "500000"
                },
                {
                  "txnId": "txn_002",
                  "amount": "5000",
                  "type": "DEBIT",
                  "narration": "Grocery Purchase",
                  "transactionTimestamp": "2025-04-09T18:30:00Z",
                  "currentBalance": "495000"
                }
              ]
            }
          }
        }
      ]
    }
  ],
  "txnid": "txn_data_fetch"
}
```

---

## Complete Workflow Script

Here's a complete bash script that runs all steps:

```bash
#!/bin/bash

BASE_URL="http://localhost:8000/api/v1/setu"

echo "🔄 SETU 1-Year Transaction Fetch - Complete Flow"
echo "================================================"

# Step 1: Get Token
echo -e "\n📝 Step 1: Generating Access Token..."
TOKEN_RESPONSE=$(curl -s -X POST $BASE_URL/token \
  -H "Content-Type: application/json" \
  -d '{"force_refresh": false}')

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')
echo "✅ Token generated: ${ACCESS_TOKEN:0:20}..."

# Step 2: Create Consent
echo -e "\n📝 Step 2: Creating Consent for 1-Year Transactions..."
CONSENT_RESPONSE=$(curl -s -X POST $BASE_URL/consents \
  -H "Content-Type: application/json" \
  -d '{
    "vua": "9999999999@onemoney",
    "dataRange": {
      "from": "2024-04-16T00:00:00Z",
      "to": "2025-04-15T23:59:59Z"
    },
    "fiTypes": ["DEPOSIT"],
    "consentTypes": ["PROFILE", "SUMMARY", "TRANSACTIONS"],
    "consentDuration": {
      "unit": "MONTH",
      "value": 12
    },
    "purpose": {
      "code": "103",
      "text": "Loan underwriting",
      "refUri": "https://www.setu.co/purpose",
      "category": {"type": "LOAN"}
    }
  }')

CONSENT_ID=$(echo $CONSENT_RESPONSE | jq -r '.id')
CONSENT_URL=$(echo $CONSENT_RESPONSE | jq -r '.url')
CONSENT_STATUS=$(echo $CONSENT_RESPONSE | jq -r '.status')

echo "✅ Consent created: $CONSENT_ID"
echo "📍 Status: $CONSENT_STATUS"
echo "🌐 Please visit to approve: $CONSENT_URL"

# Step 3: Wait for User Approval (manual step)
echo -e "\n⏳ Waiting for consent approval..."
echo "Press ENTER after approving consent..."
read

# Step 4: Create Data Fetch Session
echo -e "\n📝 Step 3: Creating Data Fetch Session..."
SESSION_RESPONSE=$(curl -s -X POST $BASE_URL/consents/$CONSENT_ID/data-fetch \
  -H "Content-Type: application/json" \
  -d '{
    "consentId": "'$CONSENT_ID'",
    "dataRange": {
      "from": "2024-04-16T00:00:00Z",
      "to": "2025-04-15T23:59:59Z"
    },
    "format": "json"
  }')

SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.session_id')
SESSION_STATUS=$(echo $SESSION_RESPONSE | jq -r '.status')

echo "✅ Session created: $SESSION_ID"
echo "📍 Status: $SESSION_STATUS"

# Step 5: Poll for Data
echo -e "\n📝 Step 4: Polling for Transaction Data..."
MAX_ATTEMPTS=20
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  POLL_RESPONSE=$(curl -s -X GET $BASE_URL/sessions/$SESSION_ID)
  POLL_STATUS=$(echo $POLL_RESPONSE | jq -r '.status')
  
  echo "  Attempt $((ATTEMPT+1))/$MAX_ATTEMPTS - Status: $POLL_STATUS"
  
  if [ "$POLL_STATUS" = "COMPLETED" ]; then
    echo "✅ Data fetched successfully!"
    echo -e "\n📊 Transaction Summary:"
    echo $POLL_RESPONSE | jq '.fips[0].accounts[0].data.account | {maskedAccNumber, type, summary, transactionCount: (.transactions | length)}'
    break
  elif [ "$POLL_STATUS" = "FAILED" ]; then
    echo "❌ Data fetch failed!"
    echo $POLL_RESPONSE | jq '.'
    break
  fi
  
  sleep 3
  ATTEMPT=$((ATTEMPT+1))
done

echo -e "\n✅ Workflow completed!"
```

---

## Troubleshooting

### 1. **"SETU_CLIENT_ID and SETU_CLIENT_SECRET must be configured"**
```bash
# Set in .env:
SETU_CLIENT_ID=your-client-id
SETU_CLIENT_SECRET=your-client-secret
SETU_PRODUCT_INSTANCE_ID=your-product-instance-id
```

### 2. **Consent Status stuck at PENDING**
- Check that you visited the approval URL
- Ensure you logged in with correct credentials
- Wait a few seconds after approval before creating data-fetch session

### 3. **Session Status stuck at PENDING**
- Normal behavior - SETU backend processes data asynchronously
- Continue polling every 3-5 seconds
- May take 10-60 seconds depending on data volume

### 4. **Empty Transactions in Response**
- Confirm the data range includes actual transaction dates
- Some demo accounts may have limited/no transaction data
- Verify VUA (Virtual User Account) is correct

---

## Data Range Examples

| Period | From | To |
|--------|------|-----|
| Last 12 Months | `2024-04-16T00:00:00Z` | `2025-04-15T23:59:59Z` |
| Current Calendar Year | `2025-01-01T00:00:00Z` | `2025-12-31T23:59:59Z` |
| FY 2024-25 (India) | `2024-04-01T00:00:00Z` | `2025-03-31T23:59:59Z` |
| FY 2023-24 (India) | `2023-04-01T00:00:00Z` | `2024-03-31T23:59:59Z` |

---

## Response Data Structure

Transaction data is nested in the response:
```
response
  ├── fips[] (Financial Institutions)
  │   └── accounts[] (Linked Accounts)
  │       ├── maskedAccNumber
  │       ├── fiType
  │       └── data.account
  │           ├── summary (Current Balance)
  │           └── transactions[] (Transaction List)
  │               ├── txnId
  │               ├── amount
  │               ├── type (CREDIT/DEBIT)
  │               ├── narration
  │               ├── transactionTimestamp
  │               └── currentBalance
```

---

## Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/token` | POST | Generate access token |
| `/consents` | POST | Create consent request |
| `/consents/{id}/data-fetch` | POST | Initiate data fetch session |
| `/sessions/{id}` | GET | Poll session for transaction data |
| `/webhook` | POST | Receive async notifications |

