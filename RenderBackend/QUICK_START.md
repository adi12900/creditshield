# Quick Start - Deploy to Render in 5 Minutes

## Prerequisites
- GitHub/GitLab account
- Render account (free tier works)
- PostgreSQL database credentials (or create on Render)

## Steps

### 1. Push to Git (2 minutes)

```bash
cd RenderBackend
git init
git add .
git commit -m "Ready for Render deployment"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Create Database on Render (1 minute)

1. Go to https://dashboard.render.com/
2. New + → PostgreSQL
3. Name: `creditshield-db`
4. Create Database
5. Copy the **Internal Database URL**

### 3. Deploy Web Service (2 minutes)

1. New + → Web Service
2. Connect your repository
3. Settings:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variable:
   - `DATABASE_URL` = (paste internal database URL)
5. Create Web Service

### 4. Done! 🎉

Visit `https://your-app.onrender.com/docs` to see your API!

## Minimum Required Environment Variables

```
DATABASE_URL=postgresql://...
SYSTEM_ADMIN_USERNAME=system_admin
SYSTEM_ADMIN_PASSWORD=Admin@123
```

Add more variables as needed from `.env.example`.

## Test Your API

```bash
# Health check
curl https://your-app.onrender.com/health/db

# Login
curl -X POST https://your-app.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"system_admin","password":"Admin@123"}'
```

## Next Steps

- Read `DEPLOYMENT_GUIDE.md` for detailed configuration
- Add remaining environment variables for full functionality
- Run database migrations
- Change default admin password
- Configure AWS and Setu credentials for AI and financial features
