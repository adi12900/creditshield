# CreditShield Backend (FastAPI + PostgreSQL)

MVC-style backend scaffold using FastAPI and SQLAlchemy.

## Folder Structure

```text
Backend/
  app/
    controllers/
    core/
    models/
    schemas/
    views/
    main.py
  requirements.txt
  .env.example
```

## Setup

1. Create and activate a virtual environment:

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Create `.env` from `.env.example` and configure required variables:

   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and API keys
   ```

4. Run the API (make sure you're in the Backend directory):

   ```bash
   # Navigate to Backend directory first
   cd Backend
   
   # Development mode with auto-reload
   uvicorn app.main:app --reload
   
   # Or with custom host/port
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

5. Access the API:
   - API Docs: `http://127.0.0.1:8000/docs`
   - Alternative Docs: `http://127.0.0.1:8000/redoc`
   - Health Check: `http://127.0.0.1:8000/health/db`

## Common Issues

**ModuleNotFoundError: No module named 'app'**

This error occurs when uvicorn is run from the wrong directory. Make sure you're in the `Backend` folder before running uvicorn:

```bash
cd Backend
uvicorn app.main:app --reload
```

## Notes

- No tables are created at startup.
- Use `GET /health/db` to verify PostgreSQL connection.
- For production migrations, add Alembic.

## Authentication Update (JWT)

- `POST /api/v1/auth/login` issues JWT tokens.
- Predefined system admin credentials come from env-backed settings:
  - `SYSTEM_ADMIN_USERNAME` (default: `system_admin`)
  - `SYSTEM_ADMIN_PASSWORD` (default: `Admin@123`)
- All `/api/v1/users` endpoints are now restricted to `system_admin` JWT tokens.
- Workflow endpoints validate role from JWT claims instead of `x-user-role` header.

### Required DB Change

If `users.password_hash` does not exist yet, run:

```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
```

Then ensure each user has a valid hashed password by recreating users via API or updating records.

## Borrower Auth APIs (Mobile Start)

Borrower login/signup endpoints are available for mobile integration:

- `POST /api/v1/borrower/auth/signup`
- `POST /api/v1/borrower/auth/login`
- `GET /api/v1/borrower/auth/me` (Bearer token required)

### Borrower Journey APIs (Feature Modules)

- `GET /api/v1/borrower/kyc/status`
- `POST /api/v1/borrower/kyc/complete`
- `POST /api/v1/borrower/eligibility/check`
- `GET /api/v1/borrower/loan-types`
- `POST /api/v1/borrower/applications`
- `GET /api/v1/borrower/applications/current`
- `GET /api/v1/borrower/documents/required`
- `POST /api/v1/borrower/consent/submit`
- `GET /api/v1/borrower/rbi/checkpoint`
- `GET /api/v1/borrower/risk-score`
- `GET /api/v1/borrower/offers`
- `POST /api/v1/borrower/offers/{offer_id}/select`
- `GET /api/v1/borrower/agreement`
- `GET /api/v1/borrower/dashboard`
- `GET /api/v1/borrower/tracker`
- `GET /api/v1/borrower/notifications`

### Borrower Signup Request

```json
{
  "full_name": "Mohit Tade",
  "email": "mohit@example.com",
  "mobile_number": "9876543210",
  "password": "Abcd1234!"
}
```

Password rule:

- minimum 8 characters
- at least 1 uppercase letter
- at least 1 number
- at least 1 symbol

### Borrower Login Request

```json
{
  "identifier": "mohit@example.com",
  "password": "Abcd1234!"
}
```

`identifier` can be email or mobile number.

### Required Borrowers Table

```sql
CREATE TABLE IF NOT EXISTS borrowers (
  id BIGSERIAL PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile_number VARCHAR(15) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
