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

1. Create and activate a virtual environment.
2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Create `.env` from `.env.example` and update password.
4. Run the API:

   ```bash
   uvicorn app.main:app --reload
   ```

5. Open docs at `http://127.0.0.1:8000/docs`.

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
