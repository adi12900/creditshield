# Borrower API Documentation

This document covers borrower-facing APIs currently available in the backend.

## Base URL

- Local: `http://127.0.0.1:8000`
- Prefix: `/api/v1`

## Authentication

Borrower APIs use JWT bearer authentication.

1. Sign up using `POST /api/v1/borrower/auth/signup`.
2. Or log in using `POST /api/v1/borrower/auth/login`.
3. Use the returned token as:
   - `Authorization: Bearer <access_token>`

Role in token is `borrower`.

## Password Policy

Borrower password must satisfy all conditions:

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 symbol

## Borrower Auth Endpoints

### 1) Signup

- Method: `POST`
- URL: `/api/v1/borrower/auth/signup`
- Auth: Not required

Request body:

```json
{
  "full_name": "Aditi Verma",
  "email": "aditi.verma@example.com",
  "mobile_number": "9876500001",
  "password": "Aditi@123"
}
```

Success (`201`):

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "role": "borrower",
  "full_name": "Aditi Verma",
  "borrower": {
    "id": 1,
    "full_name": "Aditi Verma",
    "email": "aditi.verma@example.com",
    "mobile_number": "9876500001",
    "is_active": true,
    "created_at": "2026-04-15T10:10:10Z",
    "updated_at": "2026-04-15T10:10:10Z"
  },
  "expires_in_seconds": 3600
}
```

### 2) Login

- Method: `POST`
- URL: `/api/v1/borrower/auth/login`
- Auth: Not required

Request body:

```json
{
  "identifier": "aditi.verma@example.com",
  "password": "Aditi@123"
}
```

`identifier` supports email or mobile number.

Success (`200`) returns same shape as signup.

### 3) Borrower Profile

- Method: `GET`
- URL: `/api/v1/borrower/auth/me`
- Auth: Bearer token (borrower)

Success (`200`):

```json
{
  "id": 1,
  "full_name": "Aditi Verma",
  "email": "aditi.verma@example.com",
  "mobile_number": "9876500001",
  "is_active": true,
  "created_at": "2026-04-15T10:10:10Z",
  "updated_at": "2026-04-15T10:10:10Z"
}
```

## Borrower Journey Endpoints

All endpoints below require bearer token with borrower role.

### 1) KYC Status

- Method: `GET`
- URL: `/api/v1/borrower/kyc/status`

Response:

```json
{
  "kyc_completed": false
}
```

### 2) Mark KYC Complete

- Method: `POST`
- URL: `/api/v1/borrower/kyc/complete`

Response:

```json
{
  "status": "kyc_completed",
  "kyc_completed": true
}
```

### 3) Eligibility Check

- Method: `POST`
- URL: `/api/v1/borrower/eligibility/check`

Request body:

```json
{
  "monthly_income": 85000,
  "existing_obligations": 22000
}
```

Response:

```json
{
  "eligible": true,
  "score": 63,
  "reason": "Eligibility estimated from income-obligation profile"
}
```

### 4) Loan Types

- Method: `GET`
- URL: `/api/v1/borrower/loan-types`

### 5) Create Loan Application

- Method: `POST`
- URL: `/api/v1/borrower/applications`

Request body:

```json
{
  "loan_type": "personal",
  "loan_amount": 300000
}
```

Possible responses:

- `200`: application created
- `403`: `Complete KYC before applying for loan`

### 6) Current Application

- Method: `GET`
- URL: `/api/v1/borrower/applications/current`

### 7) Required Documents

- Method: `GET`
- URL: `/api/v1/borrower/documents/required`

### 8) Consent Submit

- Method: `POST`
- URL: `/api/v1/borrower/consent/submit`

Request body:

```json
{
  "consent_version": "v1"
}
```

### 9) RBI Checkpoint

- Method: `GET`
- URL: `/api/v1/borrower/rbi/checkpoint`

### 10) Risk Score

- Method: `GET`
- URL: `/api/v1/borrower/risk-score`

### 11) Offers

- Method: `GET`
- URL: `/api/v1/borrower/offers`

### 12) Select Offer

- Method: `POST`
- URL: `/api/v1/borrower/offers/{offer_id}/select`

### 13) Agreement

- Method: `GET`
- URL: `/api/v1/borrower/agreement`

### 14) Dashboard

- Method: `GET`
- URL: `/api/v1/borrower/dashboard`

### 15) Tracker

- Method: `GET`
- URL: `/api/v1/borrower/tracker`

### 16) Notifications

- Method: `GET`
- URL: `/api/v1/borrower/notifications`

## Common Error Responses

`401 Unauthorized`

```json
{
  "detail": "Could not validate credentials"
}
```

`403 Forbidden`

```json
{
  "detail": "Not enough permissions"
}
```

## Notes

- Current borrower journey endpoints are functional for mobile integration.
- KYC status and application-tracker journey state are currently in-memory in route module state.
- For production persistence, map borrower journey state to database tables defined in `DATABASE_TABLES_CREATION.md`.
