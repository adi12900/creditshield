# CreditShield OTP Service

Node.js microservice for sending KYC verification OTPs via email using Nodemailer.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your Gmail credentials:
   ```bash
   cp .env.example .env
   ```

3. Get a Gmail App Password:
   - Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Create an app password for "Mail"
   - Paste the 16-character password into `.env` as `GMAIL_APP_PASSWORD`

## Running

```bash
npm start
```

Service runs on `http://localhost:3001` by default.

## API Endpoints

### POST /send-otp
Sends a 6-digit OTP to the specified email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

### POST /verify-otp
Verifies the OTP for a given email.

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "valid": true,
  "message": "OTP verified successfully"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Notes

- OTPs expire after 10 minutes (configurable via `OTP_EXPIRY_MINUTES`)
- OTPs are stored in-memory (restarting the service clears all OTPs)
- For production, consider using Redis or a database for OTP storage
