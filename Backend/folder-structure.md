# FastAPI Backend Folder Structure Guide (LOS Project)

This guide explains the backend structure in very simple words.
It is made for a student team building a Loan Origination System (LOS) with AI-based risk prediction.

## 1) Folder Structure (Tree)

```text
Backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── auth/
│   │       ├── users/
│   │       ├── loans/
│   │       ├── applications/
│   │       └── risk/
│   ├── core/
│   │   ├── config/
│   │   └── security/
│   ├── db/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── loans/
│   │   └── risk/
│   ├── ai/
│   │   ├── ml/
│   │   │   ├── models/
│   │   │   ├── inference/
│   │   │   └── preprocessing/
│   │   └── agentic/
│   │       ├── agents/
│   │       ├── workflows/
│   │       ├── decision_engine/
│   │       └── tools/
│   ├── utils/
│   └── tests/
├── .venv/
└── requirements.txt
```

## 2) Folder-by-Folder Explanation

### app/
- What it contains:
  - All backend source code.
- Why it is used:
  - Keeps all main project logic in one place.
- Who works on it:
  - Everyone in backend team.

### app/api/
- What it contains:
  - API layer entry points.
  - Versioned APIs inside `v1`.
- Why it is used:
  - Keeps external API structure clean and organized.
- Who works on it:
  - API developer / backend developer.

### app/api/v1/auth, users, loans, applications, risk
- What it contains:
  - Route handlers for each module.
  - Endpoints like login, create loan, submit application, risk check.
- Why it is used:
  - Splits API by business domain.
  - Easy to scale when modules grow.
- Who works on it:
  - API developer.

### app/core/
- What it contains:
  - Global settings and security setup.
- Why it is used:
  - Central place for shared backend configuration.
- Who works on it:
  - Backend lead / DevOps support.

### app/core/config/
- What it contains:
  - Environment and app configuration usage.
- Why it is used:
  - Reads values from `.env` safely.
- Who works on it:
  - Backend developer.

### app/core/security/
- What it contains:
  - Authentication and authorization helpers.
- Why it is used:
  - Protects API endpoints.
- Who works on it:
  - Backend developer handling auth.

### app/db/
- What it contains:
  - Database connection/session logic.
- Why it is used:
  - One clean place to manage DB access.
- Who works on it:
  - Backend developer focused on DB integration.

### app/models/
- What it contains:
  - Database table models.
  - Example: LoanApplication, User, RiskAssessment tables.
- Why it is used:
  - Defines how data is stored in PostgreSQL.
- Who works on it:
  - Backend + database developer.

### app/schemas/
- What it contains:
  - Input/output data shapes for API validation.
  - Example: LoanCreateRequest, LoanResponse.
- Why it is used:
  - Validates client data before processing.
  - Keeps API response format consistent.
- Who works on it:
  - API/backend developer.

### app/services/
- What it contains:
  - Business logic for auth, users, loans, risk.
  - Calls AI modules and DB logic when needed.
- Why it is used:
  - Keeps routes thin and clean.
  - Makes code reusable and testable.
- Who works on it:
  - Backend business-logic developer.

### app/services/auth, users, loans, risk
- What it contains:
  - Module-specific business rules.
  - Examples:
    - `auth`: login, token checks.
    - `loans`: eligibility rules.
    - `risk`: calls ML/Agentic components.
- Why it is used:
  - Better separation by feature.
- Who works on it:
  - Backend feature owners.

### app/ai/
- What it contains:
  - All AI-related code.
  - ML and Agentic modules.
- Why it is used:
  - Keeps AI logic separate from normal API code.
- Who works on it:
  - AI/ML developers.

### app/ai/ml/
- What it contains:
  - Traditional machine learning parts.
- Why it is used:
  - Risk scoring from numeric and historical data.
- Who works on it:
  - ML engineer.

### app/ai/ml/models/
- What it contains:
  - Trained model artifacts or model-loading code.
- Why it is used:
  - Needed for prediction.
- Who works on it:
  - ML engineer.

### app/ai/ml/inference/
- What it contains:
  - Prediction logic for runtime.
- Why it is used:
  - Converts input into a risk score quickly.
- Who works on it:
  - ML engineer + backend integration developer.

### app/ai/ml/preprocessing/
- What it contains:
  - Data cleanup and feature preparation logic.
- Why it is used:
  - Ensures model receives correct data format.
- Who works on it:
  - ML engineer.

### app/ai/agentic/
- What it contains:
  - Agent-based AI logic.
- Why it is used:
  - Handles multi-step decisions and reasoning workflows.
- Who works on it:
  - AI engineer.

### app/ai/agentic/agents/
- What it contains:
  - Specialized agents (for risk review, document checks, etc.).
- Why it is used:
  - Each agent handles one focused responsibility.
- Who works on it:
  - AI engineer.

### app/ai/agentic/workflows/
- What it contains:
  - Step-by-step agent orchestration.
- Why it is used:
  - Controls how agents cooperate.
- Who works on it:
  - AI engineer.

### app/ai/agentic/decision_engine/
- What it contains:
  - Rules combining agent outputs.
- Why it is used:
  - Produces final decision suggestions.
- Who works on it:
  - AI engineer + product logic owner.

### app/ai/agentic/tools/
- What it contains:
  - Helper utilities used by agents.
- Why it is used:
  - Reusable helper actions for agent workflows.
- Who works on it:
  - AI engineer.

### app/utils/
- What it contains:
  - Shared helper functions used across modules.
- Why it is used:
  - Avoids repeated code.
- Who works on it:
  - Any backend developer.

### app/tests/
- What it contains:
  - Unit/integration/API tests.
- Why it is used:
  - Ensures code works and prevents regressions.
- Who works on it:
  - All developers (shared responsibility).

## 3) Important Differences (Simple)

### Controllers vs Routers (API layer)
- Routers:
  - Define URL endpoints like `/v1/loans/apply`.
  - Receive request and send response.
- Controllers:
  - Optional middle layer between router and service.
  - Can keep request-handling logic cleaner.
- Simple rule:
  - Router handles HTTP.
  - Controller handles request-level processing.
  - Service handles business rules.

### Services vs Database logic
- Services:
  - Main business logic.
  - Example: check if applicant is eligible before saving loan.
- Database logic:
  - Only data operations (save, update, fetch).
  - Usually in `db/` and `models/`.
- Simple rule:
  - Service decides what to do.
  - Database layer stores and reads data.

### ML vs Agentic AI
- ML:
  - Predicts using trained model.
  - Example: risk score = 0.78.
- Agentic AI:
  - Uses multi-step reasoning and tools.
  - Example: review risk score + document quality + policy checks, then suggest approve/review/reject.
- Simple rule:
  - ML gives prediction.
  - Agentic AI gives guided decision process.

## 4) Where Things Should Go

- API routes (routers):
  - `app/api/v1/<module>/`
- Controllers (if used):
  - Optional folder like `app/controllers/` or inside each module folder.
- Business logic:
  - `app/services/`
- Database models:
  - `app/models/`
- Schemas (validation):
  - `app/schemas/`
- AI logic:
  - ML: `app/ai/ml/`
  - Agentic: `app/ai/agentic/`

## 5) Example Request Flow (LOS)

### Example A: Loan Application + Risk Prediction
- Step 1:
  - Client calls API endpoint in `app/api/v1/applications/`.
- Step 2:
  - Router forwards request to application service in `app/services/`.
- Step 3:
  - Service validates input using schema from `app/schemas/`.
- Step 4:
  - Service calls ML inference in `app/ai/ml/inference/` for risk score.
- Step 5:
  - If needed, service calls agentic workflow in `app/ai/agentic/workflows/` for deeper decision.
- Step 6:
  - Service stores application and risk result via `app/models/` and `app/db/`.
- Step 7:
  - Router returns final response (submitted, score, decision status).

### Example B: User Authentication
- Step 1:
  - Request hits `app/api/v1/auth/`.
- Step 2:
  - Auth service in `app/services/auth/` verifies user credentials.
- Step 3:
  - Security logic in `app/core/security/` creates/validates token.
- Step 4:
  - Response returns token and user access details.

### Example C: Loan Eligibility Check
- Step 1:
  - Request enters `app/api/v1/loans/`.
- Step 2:
  - Loan service checks business rules.
- Step 3:
  - Service may call risk service if needed.
- Step 4:
  - Data is read/saved from database and returned as API response.

## 6) Final Team Tip

Keep each folder focused on one job.
If code is hard to find, move it to the right folder early.
This makes teamwork faster and avoids confusion later.
