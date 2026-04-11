# CreditShield API (Flask foundation)

Loan default-risk API foundation: application factory, JWT + RBAC, SQLAlchemy + Alembic (SQLite dev), Marshmallow, mock predict, health stubs, Indian demo seed data.

**Not included:** full LOS CRUD, real bureau/KYC integrations, real ML training or SHAP, production Postgres (use `DATABASE_URL` later), Docker/CI.

## Requirements

- Python **3.11+** recommended (3.10+ supported)

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
copy .env.example .env    # optional; defaults work for local SQLite
```

Set the app (PowerShell):

```powershell
$env:FLASK_APP="wsgi:app"
```

Bash:

```bash
export FLASK_APP=wsgi:app
```

### Database

SQLite file (dev default): `backend/instance/creditshield_dev.db` (created on first migrate).

```bash
flask db upgrade
flask seed-db
```

### Run server

```bash
flask run --host 127.0.0.1 --port 5000
```

## API surface (`/api/v1`)

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| POST | `/auth/login` | No | JSON `{ "email", "password" }` → access + refresh tokens |
| POST | `/auth/refresh` | Refresh JWT | Header `Authorization: Bearer <refresh>` |
| GET | `/auth/me` | Access JWT | Profile |
| GET | `/health` | No | Liveness |
| GET | `/health/ready` | No | DB ping; **503** if DB down |
| GET | `/health/integrations` | No | Stub integration statuses |
| POST | `/predict` | Access JWT; roles `analyst`, `underwriter`, `admin` | `{ "arn": "...", "persist": true }` mock scoring; persists ML fields by default |

Send access token: `Authorization: Bearer <access_token>`.

## CORS

`flask-cors` allows **`http://localhost:5173`** for paths under `/api/*`. JWTs are sent via the `Authorization` header (no cookie credentials required for this foundation).

## Vite proxy

Point the SPA at the Flask port through a dev proxy:

```ts
// vite.config.ts
server: {
  proxy: {
    '/api': { target: 'http://localhost:5000', changeOrigin: true },
  },
},
```

Frontend base URL: `VITE_API_BASE_URL=/api/v1` or use relative requests to `/api/v1/...` when the proxy is enabled.

## Demo users (dev only — rotate in any shared environment)

| Email | Role | Password |
|-------|------|----------|
| priya.analyst@demo.creditshield.in | analyst | DemoPass123! |
| rahul.underwriter@demo.creditshield.in | underwriter | DemoPass123! |
| admin@demo.creditshield.in | admin | DemoAdmin123! |

Sample ARNs after `flask seed-db`: `CS-2024-IN-00001` … `CS-2024-IN-00012`.

## ML scaffold

- `ml/train.py` — training placeholder
- `ml/predictor.py` — `load_model` / `predict` stubs
- `ml/saved_models/` — keep `.gitkeep`; add `*.pkl` / `*.joblib` locally (ignored by git)

Optional future deps: see `requirements-ml.txt`.

## Security notes

- Default `SECRET_KEY` / `JWT_SECRET_KEY` are for **local development only**.
- SQLite is **not** suitable for production; set `DATABASE_URL` when you move to Postgres or another server DB.
