# Setu AA v2 Integration - Testing Guide

This guide provides all endpoints and testing procedures for the Setu Account Aggregator v2 API integration.

## Prerequisites

1. **Environment Variables** - Set these in `.env`:
   ```
   SETU_BASE_URL=https://fiu-sandbox.setu.co
   SETU_PRODUCTION_BASE_URL=https://fiu.setu.co
   SETU_CLIENT_ID=<your-client-id>
   SETU_CLIENT_SECRET=<your-client-secret>
   SETU_PRODUCT_INSTANCE_ID=<your-product-instance-id>
   SETU_TOKEN_URL=https://orgservice-prod.setu.co/v1/users/login
   SETU_REQUEST_TIMEOUT_SECONDS=30
   ```

2. **Get Credentials** from Setu Bridge:
   - Register at https://bridge.setu.co
   - Create an FIU product
   - Copy `x-product-instance-id`, `x-client-id`, and `x-client-secret`

## API Base URL

- **Sandbox**: `http://localhost:8000/api/v1/setu`  (for local testing)
- **Production**: Your production backend URL

---

## 1. Generate Access Token

Generate a Bearer token for subsequent API calls.

### Endpoint
```
POST /api/v1/setu/token
```

### Request
```bash
curl -X POST http://localhost:8000/api/v1/setu/token \
  -H "Content-Type: application/json" \
  -d '{
    "force_refresh": false
  }'
```

### cURL with Variables
```bash
BASE_URL="http://localhost:8000/api/v1/setu"

curl -X POST $BASE_URL/token \
  -H "Content-Type: application/json" \
  -d '{
    "force_refresh": false
  }' | jq '.'
```

### Response (Success - 200)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "expires_at": "2026-04-13T19:45:00Z"
}
```

### Response (Error - 500/502)
```json
{
  "detail": "SETU_CLIENT_ID and SETU_CLIENT_SECRET must be configured"
}
```

---

## 2. Create Consent Request

Create a consent request for user data access.

### Endpoint
```
POST /api/v1/setu/consents
```

### Request Body Schema

```json
{
  "vua": "9999999999@onemoney",
  "dataRange": {
    "from": "2023-01-01T00:00:00Z",
    "to": "2025-12-31T23:59:59Z"
  },
  "fiTypes": ["DEPOSIT"],
  "consentTypes": ["PROFILE", "SUMMARY", "TRANSACTIONS"],
  "consentDuration": {
    "unit": "MONTH",
    "value": 24
  },
  "purpose": {
    "code": "103",
    "text": "Loan underwriting and risk assessment",
    "refUri": "https://www.setu.co/purpose",
    "category": {
      "type": "LOAN"
    }
  }
}
```

### cURL Example (Full)
```bash
BASE_URL="http://localhost:8000/api/v1/setu"

curl -X POST $BASE_URL/consents \
  -H "Content-Type: application/json" \
  -d '{
    "vua": "9999999999@onemoney",
    "dataRange": {
      "from": "2023-01-01T00:00:00Z",
      "to": "2025-12-31T23:59:59Z"
    },
    "fiTypes": ["DEPOSIT"],
    "consentTypes": ["PROFILE", "SUMMARY", "TRANSACTIONS"],
    "consentDuration": {
      "unit": "MONTH",
      "value": 24
    },
    "purpose": {
      "code": "103",
      "text": "Loan underwriting and risk assessment",
      "refUri": "https://www.setu.co/purpose",
      "category": {
        "type": "LOAN"
      }
    }
  }' | jq '.'
```

### Minimal Example (Uses Defaults)
```bash
BASE_URL="http://localhost:8000/api/v1/setu"

curl -X POST $BASE_URL/consents \
  -H "Content-Type: application/json" \
  -d '{
    "vua": "9999999999@onemoney",
    "dataRange": {
      "from": "2023-01-01T00:00:00Z",
      "to": "2025-12-31T23:59:59Z"
    }
  }' | jq '.'
```

### Response (Success - 201)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://aa-sandbox.setu.co/consent/550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING",
  "txnid": "txn_550e8400"
}
```

**Next Step**: User must visit the `url` to approve the consent.

### Valid FI Types
```
DEPOSIT, TERM_DEPOSIT, RECURRING_DEPOSIT, SIP, CP, GOVT_SECURITIES, EQUITIES,
BONDS, DEBENTURES, MUTUAL_FUNDS, ETF, IDR, CIS, AIF, INSURANCE_POLICIES,
NPS, INVIT, REIT, GSTR1_3B, OTHER
```

### Purpose Codes
- `101`: Wealth management
- `102`: Investment advice
- `103`: Loan underwriting (recommended)
- `104`: Insurance underwriting
- `105`: Credit rating

---

## 3. Fetch FI Data (Create Session)

Create a data fetch session after consent is approved.

### Endpoint
```
POST /api/v1/setu/consents/{consent_id}/data-fetch
```

### Request
```bash
CONSENT_ID="550e8400-e29b-41d4-a716-446655440000"

curl -X POST http://localhost:8000/api/v1/setu/consents/$CONSENT_ID/data-fetch \
  -H "Content-Type: application/json" \
  -d '{
    "consentId": "'$CONSENT_ID'",
    "dataRange": {
      "from": "2023-01-01T00:00:00Z",
      "to": "2025-12-31T23:59:59Z"
    },
    "format": "json"
  }' | jq '.'
```

### Response (Success - 201)
```json
{
  "session_id": "sess_550e8400-e29b-41d4-a716",
  "consent_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING",
  "txnid": "txn_data_fetch"
}
```

---

## 4. Get FI Data from Session

Retrieve the actual financial data from a session.

### Endpoint
```
GET /api/v1/setu/sessions/{session_id}
```

### Request
```bash
SESSION_ID="sess_550e8400-e29b-41d4-a716"

curl -X GET http://localhost:8000/api/v1/setu/sessions/$SESSION_ID \
  -H "Content-Type: application/json" | jq '.'
```

### Response (Success - 200)

**When data is ready (status: COMPLETED)**:
```json
{
  "id": "sess_550e8400-e29b-41d4-a716",
  "status": "COMPLETED",
  "consentId": "550e8400-e29b-41d4-a716-446655440000",
  "dataRange": {
    "from": "2023-01-01T00:00:00Z",
    "to": "2025-12-31T23:59:59Z"
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

**When data is still processing (status: PENDING)**:
```json
{
  "id": "sess_550e8400-e29b-41d4-a716",
  "status": "PENDING",
  "consentId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Data fetch in progress. Retry after 2 seconds."
}
```

### Polling Strategy
```bash
# Poll every 3 seconds until status is COMPLETED or FAILED
SESSION_ID="sess_550e8400-e29b-41d4-a716"
MAX_ATTEMPTS=20
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  RESPONSE=$(curl -s http://localhost:8000/api/v1/setu/sessions/$SESSION_ID)
  STATUS=$(echo $RESPONSE | jq -r '.status')
  
  echo "Attempt $((ATTEMPT+1)): Status = $STATUS"
  
  if [ "$STATUS" = "COMPLETED" ]; then
    echo "Data fetched successfully!"
    echo $RESPONSE | jq '.'
    break
  elif [ "$STATUS" = "FAILED" ]; then
    echo "Data fetch failed!"
    echo $RESPONSE | jq '.'
    break
  fi
  
  sleep 3
  ATTEMPT=$((ATTEMPT+1))
done
```

---

## 5. Webhook Callback Handler

Setu sends webhooks to notify about consent and data events.

### Webhook URL Configuration
In Setu Bridge dashboard, configure:
```
https://yourdomain.com/api/v1/setu/webhook
```

### Webhook Events

**Consent Event (User approves/rejects)**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "ACTIVE"
}
```

**Expected webhook types**:
- `PENDING`: Consent created, awaiting user action
- `ACTIVE`: User approved consent
- `REJECTED`: User rejected consent
- `REVOKED`: User revoked previously approved consent
- `EXPIRED`: Consent validity period expired

### Testing Webhook Locally with ngrok
```bash
# Install ngrok: https://ngrok.com/

# Start your backend
cd Backend && python -m uvicorn app.main:app --reload --port 8000

# In another terminal, expose your local port
ngrok http 8000

# Use the ngrok URL in Setu Bridge:
# https://abc123.ngrok.io/api/v1/setu/webhook
```

---

## 6. Complete End-to-End Flow

```bash
#!/bin/bash

BASE_URL="http://localhost:8000/api/v1/setu"

echo "=== Step 1: Get Token ==="
TOKEN_RESPONSE=$(curl -s -X POST $BASE_URL/token \
  -H "Content-Type: application/json" \
  -d '{"force_refresh": false}')

TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')
echo "Access Token: $TOKEN"

echo -e "\n=== Step 2: Create Consent ==="
CONSENT_RESPONSE=$(curl -s -X POST $BASE_URL/consents \
  -H "Content-Type: application/json" \
  -d '{
    "vua": "9999999999@onemoney",
    "dataRange": {
      "from": "2023-01-01T00:00:00Z",
      "to": "2025-12-31T23:59:59Z"
    },
    "fiTypes": ["DEPOSIT"],
    "consentTypes": ["PROFILE", "SUMMARY", "TRANSACTIONS"],
    "consentDuration": {"unit": "MONTH", "value": 24},
    "purpose": {
      "code": "103",
      "text": "Loan underwriting",
      "refUri": "https://www.setu.co/purpose",
      "category": {"type": "LOAN"}
    }
  }')

CONSENT_ID=$(echo $CONSENT_RESPONSE | jq -r '.id')
CONSENT_URL=$(echo $CONSENT_RESPONSE | jq -r '.url')

echo "Consent ID: $CONSENT_ID"
echo "Approval URL: $CONSENT_URL"
echo "⚠️  User must visit the approval URL to approve the consent"

echo -e "\n=== Step 3: Fetch FI Data (after consent approval) ==="
# Wait for user approval (manual step in sandbox - use mock data)

DATA_FETCH_RESPONSE=$(curl -s -X POST $BASE_URL/consents/$CONSENT_ID/data-fetch \
  -H "Content-Type: application/json" \
  -d '{
    "consentId": "'$CONSENT_ID'",
    "dataRange": {
      "from": "2023-01-01T00:00:00Z",
      "to": "2025-12-31T23:59:59Z"
    },
    "format": "json"
  }')

SESSION_ID=$(echo $DATA_FETCH_RESPONSE | jq -r '.session_id')
echo "Session ID: $SESSION_ID"

echo -e "\n=== Step 4: Poll for Data ==="
for i in {1..10}; do
  echo "Poll attempt $i..."
  
  DATA_RESPONSE=$(curl -s -X GET $BASE_URL/sessions/$SESSION_ID \
    -H "Content-Type: application/json")
  
  STATUS=$(echo $DATA_RESPONSE | jq -r '.status')
  echo "Status: $STATUS"
  
  if [ "$STATUS" = "COMPLETED" ]; then
    echo "✅ Data available!"
    echo $DATA_RESPONSE | jq '.fips[0].accounts[0].data.account.summary'
    break
  fi
  
  sleep 2
done
```

---

## 7. Error Codes & Troubleshooting

| Code | Error | Cause | Fix |
|------|-------|-------|-----|
| 500 | SETU_CLIENT_ID/SECRET not configured | Missing env variables | Set .env file |
| 502 | Token generation failed | Invalid credentials | Verify Setu Bridge credentials |
| 409 | Consent not approved | User hasn't approved consent | Wait for user approval |
| 404 | Session/Consent not found | Invalid ID | Use correct ID from response |
| 400 | Bad Request | Invalid payload format | Check request JSON schema |

### Debug Headers
Always include for troubleshooting:
```bash
curl -i -X POST ... # Shows response headers
curl -v -X POST ... # Verbose output with all details
```

---

## 8. Migration from Old Integration

**Old endpoint**: `POST /generate-token` → **New**: `POST /token`
**Old endpoint**: `POST /create-consent` → **New**: `POST /consents`
**Old endpoint**: `POST /fetch-transactions` → **New**: `POST /consents/{id}/data-fetch` + `GET /sessions/{id}`

### Request Mapping

**Old Create Consent**:
```json
{
  "customer": {"mobile": "9999999999"},
  "purpose": "Loan Risk Assessment",
  "fi_types": ["DEPOSIT"]
}
```

**New Create Consent**:
```json
{
  "vua": "9999999999@onemoney",
  "dataRange": {"from": "...", "to": "..."},
  "fiTypes": ["DEPOSIT"],
  "purpose": {"code": "103", "text": "...", "refUri": "...", "category": {...}}
}
```

---

## 9. Postman Collection

Import this into Postman for easy testing:

```json
{
  "info": {
    "name": "Setu AA v2 API",
    "version": "1.0"
  },
  "item": [
    {
      "name": "Get Token",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/token",
        "body": {"raw": "{\"force_refresh\": false}"}
      }
    },
    {
      "name": "Create Consent",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/consents",
        "body": {"raw": "{...}"}
      }
    }
  ]
}
```

---

## Support

- **Setu Docs**: https://docs.setu.co/data/account-aggregator
- **API Reference**: https://docs.setu.co/data/account-aggregator/api-reference
- **Support Email**: support@setu.co

