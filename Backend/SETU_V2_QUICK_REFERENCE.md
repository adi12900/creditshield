# Setu AA v2 API - Quick Reference

## Base URL
```
http://localhost:8000/api/v1/setu
```

---

## Endpoints

### 1️⃣ GET TOKEN
```
POST /token
```
**Request:**
```json
{ "force_refresh": false }
```
**Response:**
```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

### 2️⃣ CREATE CONSENT
```
POST /consents
```
**Request:**
```json
{
  "vua": "9999999999@onemoney",
  "dataRange": {
    "from": "2023-01-01T00:00:00Z",
    "to": "2025-12-31T23:59:59Z"
  },
  "fiTypes": ["DEPOSIT"],
  "consentTypes": ["PROFILE", "SUMMARY", "TRANSACTIONS"],
  "consentDuration": { "unit": "MONTH", "value": 24 },
  "purpose": {
    "code": "103",
    "text": "Loan underwriting",
    "refUri": "https://www.setu.co/purpose",
    "category": { "type": "LOAN" }
  }
}
```
**Response:**
```json
{
  "id": "550e8400...",
  "url": "https://aa-sandbox.setu.co/consent/550e8400...",
  "status": "PENDING",
  "txnid": "txn_550e8400"
}
```
**User Action**: Visit `url` to approve

---

### 3️⃣ FETCH FI DATA (Create Session)
```
POST /consents/{consent_id}/data-fetch
```
**Request:**
```json
{
  "consentId": "550e8400-e29b-41d4-a716-446655440000",
  "dataRange": {
    "from": "2023-01-01T00:00:00Z",
    "to": "2025-12-31T23:59:59Z"
  },
  "format": "json"
}
```
**Response:**
```json
{
  "session_id": "sess_550e8400...",
  "consent_id": "550e8400...",
  "status": "PENDING",
  "txnid": "txn_data_fetch"
}
```

---

### 4️⃣ GET FI DATA (Retrieve from Session)
```
GET /sessions/{session_id}
```
**Response (Queued):**
```json
{
  "id": "sess_550e8400...",
  "status": "PENDING"
}
```

**Response (Ready):**
```json
{
  "id": "sess_550e8400...",
  "status": "COMPLETED",
  "consentId": "550e8400...",
  "fips": [
    {
      "fipID": "HDFC0000001",
      "accounts": [
        {
          "maskedAccNumber": "XXXXX1234",
          "linkRefNumber": "abc123...",
          "data": {
            "type": "deposit",
            "account": {
              "summary": { "currentBalance": "500000" },
              "transactions": [...]
            }
          }
        }
      ]
    }
  ]
}
```

---

### 5️⃣ WEBHOOK CALLBACK
```
POST /webhook
```
**Telemetry From Setu:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "ACTIVE"
}
```
**Statuses**: PENDING, ACTIVE, REJECTED, REVOKED, EXPIRED

---

## Curl Cheatsheet

### Get Token
```bash
curl -X POST http://localhost:8000/api/v1/setu/token \
  -H "Content-Type: application/json" \
  -d '{"force_refresh": false}'
```

### Create Consent
```bash
curl -X POST http://localhost:8000/api/v1/setu/consents \
  -H "Content-Type: application/json" \
  -d '{
    "vua": "9999999999@onemoney",
    "dataRange": {"from": "2023-01-01T00:00:00Z", "to": "2025-12-31T23:59:59Z"}
  }'
```

### Fetch Data (after approval)
```bash
CONSENT_ID="550e8400-e29b-41d4-a716-446655440000"
curl -X POST http://localhost:8000/api/v1/setu/consents/$CONSENT_ID/data-fetch \
  -H "Content-Type: application/json" \
  -d '{
    "consentId": "'$CONSENT_ID'",
    "dataRange": {"from": "2023-01-01T00:00:00Z", "to": "2025-12-31T23:59:59Z"},
    "format": "json"
  }'
```

### Get Data
```bash
SESSION_ID="sess_550e8400-e29b-41d4-a716"
curl -X GET http://localhost:8000/api/v1/setu/sessions/$SESSION_ID
```

### Poll for Data (Every 3 seconds)
```bash
SESSION_ID="sess_550e8400-e29b-41d4-a716"
for i in {1..20}; do
  curl -s http://localhost:8000/api/v1/setu/sessions/$SESSION_ID | jq '.status'
  sleep 3
done
```

---

## FI Types
```
DEPOSIT, TERM_DEPOSIT, RECURRING_DEPOSIT, SIP, CP, GOVT_SECURITIES,
EQUITIES, BONDS, DEBENTURES, MUTUAL_FUNDS, ETF, IDR, CIS, AIF,
INSURANCE_POLICIES, NPS, INVIT, REIT, GSTR1_3B, OTHER
```

---

## Purpose Codes
```
101 = Wealth management
102 = Investment advice
103 = Loan underwriting ⭐ (Most common)
104 = Insurance underwriting
105 = Credit rating
```

---

## Status Codes
```
200 = OK
201 = Created
400 = Bad Request
409 = Conflict
500 = Server Error
502 = Bad Gateway (Setu service error)
504 = Timeout
```

---

## Environment Variables Required
```
SETU_CLIENT_ID=your_id
SETU_CLIENT_SECRET=your_secret
SETU_PRODUCT_INSTANCE_ID=your_product_id
```

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ 1. POST /token → Get access_token                       │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 2. POST /consents → Get consent_id & approval_url       │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 3. User visits approval_url & approves in Setu app      │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 4. POST /consents/{id}/data-fetch → Get session_id      │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 5. GET /sessions/{session_id} (poll until COMPLETED)    │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ ✅ FI Data ready (transactions, balance, etc.)          │
└────────────────────────────────────────────────────────┘
```

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `SETU_CLIENT_ID not configured` | Missing .env | Set SETU_CLIENT_ID in .env |
| `Token generation failed (502)` | Invalid credentials | Verify client_id/secret in Setu Bridge |
| `Consent not found (404)` | Wrong consent_id | Copy exact ID from create response |
| `Status: PENDING` | Data still processing | Wait 2-3 sec and retry |
| `Status: FAILED` | FIP service error | Check FIP status or retry |

---

## Testing Checklist

- [ ] Token generated successfully
- [ ] Consent created and URL received
- [ ] User approved consent in Setu app
- [ ] Data fetch session created
- [ ] Poll status became COMPLETED
- [ ] FI data received with transactions
- [ ] Webhook received consent update

✅ **All set!** Your integration is v2-compliant.

