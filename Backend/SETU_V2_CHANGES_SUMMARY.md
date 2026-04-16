# Setu AA v2 Integration - Changes Summary

## Overview
Your backend Setu Account Aggregator integration has been fully upgraded to Setu AA v2 API specifications. All endpoints, request formats, and authentication mechanisms now comply with the official Setu v2 documentation.

---

## Files Modified

### 1. **Backend/app/core/config.py**
**Changes:**
- Replaced old bridge.setu.co base URL with official v2 endpoints:
  - Sandbox: `https://fiu-sandbox.setu.co`
  - Production: `https://fiu.setu.co`
- Updated all v2 endpoint paths:
  - `/v2/consents` (from `/api/aa/consents`)
  - `/v2/consents/{request_id}` (new)
  - `/v2/sessions` (new - session-based data fetch)
  - `/v2/sessions/{session_id}` (new)
- Added `setu_product_instance_id` config (required for v2)
- Corrected token URL to `https://orgservice-prod.setu.co/v1/users/login`

### 2. **Backend/.env.example**
**Changes:**
- Updated environment variable names to match v2 config
- Added new v2-specific vars:
  - `SETU_PRODUCTION_BASE_URL`
  - `SETU_PRODUCT_INSTANCE_ID` (required!)
  - `SETU_TOKEN_URL`
- Removed deprecated paths

### 3. **Backend/app/schemas/setu.py**
**Changes:**
- Completely rewritten for v2 API contracts
- **New models:**
  - `ConsentDuration`: Duration object (unit, value)
  - `DataRange`: Date range with from/to timestamps
  - `PurposeCategory`: Purpose categorization
  - `Purpose`: Structured purpose object with code, text, refUri
  - `CreateFIDataFetchRequest`: Session-based data fetch (replaces old transactions endpoint)
  - `FIProvider`, `FIAccount`: v2 response structure
- **Updated models:**
  - `CreateConsentRequest`: Now uses vua, dataRange, fiTypes, consentDuration, purpose
  - `GenerateTokenResponse`: Added refresh_token, made fields optional
- **Backward compatibility:** Kept legacy transaction models for gradual migration

### 4. **Backend/app/services/risk/setu_aa_service.py**
**Major Changes:**

#### Token Generation
- Simplified to single v2 endpoint: `POST /users/login`
- Removed fallback attempts (now uses official endpoint only)
- Cleaned up error handling

#### Consent Creation (`create_consent`)
- **Old signature**: `mobile_number, purpose, fi_types`
- **New signature**: `vua, data_range, fi_types, consent_types, consent_duration, purpose`
- Now includes proper v2 headers: `Authorization` + `x-product-instance-id`
- Uses correct v2 request payload structure
- Returns v2 response format: `id, url, status, txnid`

#### Data Fetch Flow (NEW)
- Added `fetch_fi_data()`: Creates session-based data fetch (replaces old transactions endpoint)
- Added `get_fi_data()`: Retrieves data from session (polling mechanism)
- Added `_extract_and_normalize_transactions()`: Handles v2 FI data structure traversal
- `fetch_transactions()`: Backward-compatible wrapper using v2 flow internally

#### Headers & Authentication
- All v2 endpoints now include required headers:
  - `Authorization: Bearer <token>`
  - `x-product-instance-id: <product-id>` (v2 requirement)
  - `Content-Type: application/json`

### 5. **Backend/app/api/v1/risk/setu_routes.py**
**Changes:**
- Updated route paths:
  - `/token` (was `/generate-token`)
  - `/consents` (was `/create-consent`)
  - `/consents/{consent_id}/data-fetch` (new - replaces `/fetch-transactions`)
  - `/sessions/{session_id}` (new)
  - `/webhook` (unchanged)
- Updated request/response schemas to v2 format
- Added route prefix: `/setu` for improved organization
- Maintained backward-compatible `/fetch-transactions` endpoint

### 6. **Backend/app/main.py**
**Changes:**
- Updated router mount to include `/setu` prefix
- New full path: `/api/v1/setu/` (was `/api/v1/`)

---

## Key Differences: Old vs New

| Aspect | Old Integration | New v2 Integration |
|--------|-----------------|-------------------|
| **Base URL** | `https://bridge.setu.co` | `https://fiu-sandbox.setu.co` |
| **Token Endpoint** | `/api/aa/sessions` | `POST /users/login` (orgservice) |
| **Consent Endpoint** | `POST /api/aa/consents` with mobile | `POST /v2/consents` with vua & dataRange |
| **Required Headers** | Authorization only | Authorization + x-product-instance-id |
| **Data Fetch** | Direct GET `/api/aa/consents/{id}/transactions` | Session-based: POST `/v2/sessions` → GET `/v2/sessions/{id}` |
| **Response Format** | Simple consent_id, status | Full object with id, url, status, txnid |
| **Consent Request** | Mobile + purpose text | VUA + purpose object + dataRange + consentDuration |
| **FI Types** | Limited set | 20+ types including GSTR1_3B, NPS, etc. |

---

## Required Configuration

**Update your `.env` file with:**

```env
# Setu AA v2 Configuration
SETU_BASE_URL=https://fiu-sandbox.setu.co
SETU_PRODUCTION_BASE_URL=https://fiu.setu.co

# Get these from https://bridge.setu.co
SETU_CLIENT_ID=your_client_id_here
SETU_CLIENT_SECRET=your_client_secret_here
SETU_PRODUCT_INSTANCE_ID=your_product_instance_id_here

SETU_TOKEN_URL=https://orgservice-prod.setu.co/v1/users/login
SETU_CONSENT_PATH=/v2/consents
SETU_CONSENT_GET_PATH_TEMPLATE=/v2/consents/{request_id}
SETU_SESSIONS_PATH=/v2/sessions
SETU_SESSIONS_GET_PATH_TEMPLATE=/v2/sessions/{session_id}
SETU_REQUEST_TIMEOUT_SECONDS=30
```

---

## Testing

A comprehensive testing guide has been created: **SETU_V2_API_TESTING_GUIDE.md**

**Quick start:**

```bash
# 1. Generate token
curl -X POST http://localhost:8000/api/v1/setu/token

# 2. Create consent
curl -X POST http://localhost:8000/api/v1/setu/consents \
  -H "Content-Type: application/json" \
  -d '{
    "vua": "9999999999@onemoney",
    "dataRange": {
      "from": "2023-01-01T00:00:00Z",
      "to": "2025-12-31T23:59:59Z"
    }
  }'

# 3. Fetch FI data (after user approves)
curl -X POST http://localhost:8000/api/v1/setu/consents/{consent_id}/data-fetch \
  -H "Content-Type: application/json" \
  -d '{
    "consentId": "{consent_id}",
    "dataRange": {
      "from": "2023-01-01T00:00:00Z",
      "to": "2025-12-31T23:59:59Z"
    },
    "format": "json"
  }'

# 4. Get data from session
curl -X GET http://localhost:8000/api/v1/setu/sessions/{session_id}
```

**Full testing guide with Postman and curl examples**: See `SETU_V2_API_TESTING_GUIDE.md`

---

## Backward Compatibility

- **Legacy endpoint `/fetch-transactions` still available**: It wraps v2 session-based flow internally
- **Old transaction request format still accepted**: Will be converted to v2 internally
- **Spring migration path available**: You can update frontend at your own pace

---

## Verification Checklist

- [x] Base URL updated to v2 endpoints
- [x] All endpoint paths corrected for v2 API
- [x] x-product-instance-id header added to all v2 calls
- [x] Token generation uses correct v2 endpoint
- [x] Consent request uses vua + dataRange format
- [x] Session-based data fetch implemented
- [x] Response schemas align with v2 spec
- [x] Error handling updated for v2 error codes
- [x] Webhook handler supports v2 payload structure
- [x] Environment variables documented
- [x] Config file aligned with v2 requirements

---

## Next Steps

1. **Update .env** with Setu Bridge credentials (REQUIRED!)
2. **Test token generation** endpoint first
3. **Verify consent creation flow** in sandbox
4. **Test data fetch** with mock data
5. **Configure webhook URL** in Setu Bridge dashboard
6. **Do end-to-end test** using the provided test script
7. **Deploy to production** when ready (update base URLs in config)

---

## Support Resources

- **Official Setu v2 Docs**: https://docs.setu.co/data/account-aggregator
- **API Reference**: https://docs.setu.co/data/account-aggregator/api-reference
- **OpenAPI Spec**: https://raw.githubusercontent.com/SetuHQ/docs/main/api-references/data/account-aggregator.json
- **Setu Support**: support@setu.co
- **Testing in Browser**: Postman collection available in testing guide

