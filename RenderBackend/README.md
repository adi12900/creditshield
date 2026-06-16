# CreditShield Backend - Render Deployment

Clean FastAPI backend ready for Render deployment.

## Quick Deploy to Render

### Option 1: Using render.yaml (Recommended)

1. Push this `RenderBackend` folder to a Git repository
2. Connect your repository to Render
3. Render will automatically detect `render.yaml` and configure the service
4. Add sensitive environment variables in Render Dashboard:
   - `DATABASE_URL`
   - `SYSTEM_ADMIN_USERNAME`
   - `SYSTEM_ADMIN_PASSWORD`
   - `SETU_CLIENT_ID`
   - `SETU_CLIENT_SECRET`
   - `SETU_PRODUCT_INSTANCE_ID`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_ACCESS_KEY`
   - `AWS_SECRET_KEY`
   - `AWS_BUCKET_NAME`
   - `STORAGE_URL`
   - `BACKEND_BASE_URL`
   - `FRONTEND_BASE_URL`

### Option 2: Manual Configuration

1. Create a new Web Service on Render
2. Connect your Git repository
3. Configure the service:
   - **Root Directory**: `RenderBackend`
   - **Environment**: Python 3
   - **Region**: Singapore (or your preferred region)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add all environment variables from `.env.example`

## Environment Variables

All required environment variables are listed in `.env.example`. You must configure these in the Render Dashboard.

### Critical Variables

- `DATABASE_URL`: PostgreSQL connection string
- `SYSTEM_ADMIN_USERNAME`: Admin username for JWT auth
- `SYSTEM_ADMIN_PASSWORD`: Admin password
- `AWS_*`: AWS credentials for Bedrock AI and S3 storage
- `SETU_*`: Setu API credentials for financial data

## Post-Deployment

Once deployed, your API will be available at:
- API Docs: `https://your-app.onrender.com/docs`
- Health Check: `https://your-app.onrender.com/health/db`

## Database Setup

Make sure your PostgreSQL database is set up with the required tables. Check the main Backend folder for migration files in `Backend/migrations/`.

## Local Testing

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Run locally
uvicorn app.main:app --reload
```

## Default System Admin Credentials

- Username: `system_admin`
- Password: `Admin@123`

**Important**: Change these credentials in production via environment variables!

## API Documentation

Once running, visit `/docs` for interactive API documentation powered by Swagger UI.
