# Borrower Flow and APIs

## Overview

This document explains the borrower journey flow and all borrower APIs exposed by backend.

Base URL:
- `http://127.0.0.1:8000`

API Prefix:
- `/api/v1`

Authentication:
- JWT Bearer token
- Header format: `Authorization: Bearer <access_token>`

## Borrower End-to-End Flow

1. Borrower signs up.
2. Borrower logs in.
3. App checks borrower profile and KYC status.
4. If KYC pending, borrower completes KYC.
5. Borrower checks eligibility.
6. Borrower fetches loan types.
7. Borrower creates loan application (allowed only after KYC complete).
8. Borrower checks current application/tracker.
9. Borrower reviews offers and selects one.
10. Borrower views agreement and dashboard.
11. Borrower reads notifications.

## API List (Journey Order)

### 1) Signup

- Method: `POST`
- Endpoint: `/api/v1/borrower/auth/signup`
- Auth: Not required

Request:

```json
{
  "full_name": "Aarav Sharma",
  "email": "aarav.sharma@example.com",
  "mobile_number": "9876543210",
  "password": "Aarav@123"
}
```

Success:
- `201 Created`
- Returns borrower profile and access token

### 2) Login

- Method: `POST`
- Endpoint: `/api/v1/borrower/auth/login`
- Auth: Not required

Request:

```json
{
  "identifier": "aarav.sharma@example.com",
  "password": "Aarav@123"
}
```

Success:
- `200 OK`
- Returns borrower profile and access token

### 3) Borrower Profile

- Method: `GET`
- Endpoint: `/api/v1/borrower/auth/me`
- Auth: Bearer token required

Success:
- `200 OK`
- Returns borrower profile

### 4) KYC Status

- Method: `GET`
- Endpoint: `/api/v1/borrower/kyc/status`
- Auth: Bearer token required

Success:

```json
{
  "kyc_completed": true
}
```

### 5) Complete KYC

- Method: `POST`
- Endpoint: `/api/v1/borrower/kyc/complete`
- Auth: Bearer token required

Success:

```json
{
  "status": "kyc_completed",
  "kyc_completed": true
}
```

### 6) Eligibility Check

- Method: `POST`
- Endpoint: `/api/v1/borrower/eligibility/check`
- Auth: Bearer token required

Request:

```json
{
  "monthly_income": 85000,
  "existing_obligations": 22000
}
```

Success:
- `200 OK`
- Returns `eligible`, `score`, `reason`

### 7) Loan Types

- Method: `GET`
- Endpoint: `/api/v1/borrower/loan-types`
- Auth: Bearer token required

Success:
- `200 OK`
- Returns available loan type list

### 8) Create Application

- Method: `POST`
- Endpoint: `/api/v1/borrower/applications`
- Auth: Bearer token required

Request:

```json
{
  "loan_type": "personal",
  "loan_amount": 300000,
  "employment_type": "Salaried",
  "credit_score": 730,
  "purpose": "Medical emergency"
}
```

Success:
- `200 OK`
- Returns generated `application_id` (ARN), stage, amount

Failure:
- `403 Forbidden` if KYC not complete

### 9) Current Application

- Method: `GET`
- Endpoint: `/api/v1/borrower/applications/current`
- Auth: Bearer token required

Success:
- `200 OK`
- Returns latest borrower application info

### 10) Required Documents

- Method: `GET`
- Endpoint: `/api/v1/borrower/documents/required`
- Auth: Bearer token required

Success:
- `200 OK`
- Returns required document checklist

### 11) Submit Consent

- Method: `POST`
- Endpoint: `/api/v1/borrower/consent/submit`
- Auth: Bearer token required

Request:

```json
{
  "consent_version": "v1"
}
```

Success:
- `200 OK`
- Returns consent recorded status

### 12) RBI Checkpoint

- Method: `GET`
- Endpoint: `/api/v1/borrower/rbi/checkpoint`
- Auth: Bearer token required

Success:
- `200 OK`
- Returns disclosure flags

### 13) Risk Score

- Method: `GET`
- Endpoint: `/api/v1/borrower/risk-score`
- Auth: Bearer token required

Success:
- `200 OK`
- Returns composite score and decision

### 14) Offers

- Method: `GET`
- Endpoint: `/api/v1/borrower/offers`
- Auth: Bearer token required

Success:
- `200 OK`
- Returns lender offers list

### 15) Select Offer

- Method: `POST`
- Endpoint: `/api/v1/borrower/offers/{offer_id}/select`
- Auth: Bearer token required

Success:
- `200 OK`
- Returns selected offer confirmation

### 16) Agreement

- Method: `GET`
- Endpoint: `/api/v1/borrower/agreement`
- Auth: Bearer token required

Success:
- `200 OK`
- Returns agreement summary/status

### 17) Dashboard

- Method: `GET`
- Endpoint: `/api/v1/borrower/dashboard`
- Auth: Bearer token required

Success:
- `200 OK`
- Returns borrower dashboard summary

### 18) Tracker

- Method: `GET`
- Endpoint: `/api/v1/borrower/tracker`
- Auth: Bearer token required

Success:
- `200 OK`
- Returns current application stage and reference

### 19) Notifications

- Method: `GET`
- Endpoint: `/api/v1/borrower/notifications`
- Auth: Bearer token required

Success:
- `200 OK`
- Returns borrower notifications list

## Common Error Responses

### Unauthorized

- `401 Unauthorized`

```json
{
  "detail": "Could not validate credentials"
}
```

### Forbidden

- `403 Forbidden`

```json
{
  "detail": "Not enough permissions"
}
```

## Mobile Integration Mapping (Current)

- Login and signup: integrated
- KYC status and complete: integrated
- Offers: integrated
- Tracker: integrated
- Remaining journey screens should continue moving to API-driven data for full production readiness
