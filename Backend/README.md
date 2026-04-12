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
