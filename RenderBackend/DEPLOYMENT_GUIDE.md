# Render Deployment Guide

## Step-by-Step Deployment

### 1. Prepare Your Repository

```bash
# Initialize git if not already done
cd RenderBackend
git init
git add .
git commit -m "Initial commit for Render deployment"

# Push to GitHub/GitLab
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Create PostgreSQL Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name**: creditshield-db
   - **Database**: creditshield
   - **User**: (auto-generated)
   - **Region**: Singapore (same as your web service)
   - **Plan**: Choose appropriate plan
4. Click "Create Database"
5. Copy the **Internal Database URL** (starts with `postgresql://`)

### 3. Deploy Web Service

1. Click "New +" → "Web Service"
2. Connect your Git repository
3. Configure:
   - **Name**: creditshield-backend
   - **Region**: Singapore
   - **Branch**: main
   - **Root Directory**: (leave empty if repo root is RenderBackend, otherwise specify path)
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Choose appropriate plan

### 4. Configure Environment Variables

In the Render Dashboard, add these environment variables:

#### Required Variables

```
DATABASE_URL=<paste-your-postgres-internal-url>
SYSTEM_ADMIN_USERNAME=system_admin
SYSTEM_ADMIN_PASSWORD=Admin@123
SYSTEM_ADMIN_FULL_NAME=System Administrator

# Setu API
SETU_BASE_URL=https://fiu-sandbox.setu.co
SETU_PRODUCTION_BASE_URL=https://fiu.setu.co
SETU_CLIENT_ID=<your-setu-client-id>
SETU_CLIENT_SECRET=<your-setu-client-secret>
SETU_PRODUCT_INSTANCE_ID=<your-setu-product-id>
SETU_TOKEN_URL=https://orgservice-prod.setu.co/v1/users/login

# AWS Bedrock (AI)
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=<your-aws-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>
BEDROCK_MODEL_ID=us.meta.llama4-maverick-17b-instruct-v1:0
BEDROCK_EMBEDDING_MODEL=amazon.titan-embed-text-v2:0

# AWS S3 Storage
AWS_ACCESS_KEY=<your-s3-access-key>
AWS_SECRET_KEY=<your-s3-secret-key>
AWS_REGIONS3=ap-south-1
AWS_BUCKET_NAME=<your-bucket-name>
STORAGE_URL=<your-s3-bucket-url>

# Service URLs (update after deployment)
BACKEND_BASE_URL=https://your-app.onrender.com
FRONTEND_BASE_URL=https://your-frontend.com
OTP_SERVICE_URL=<your-otp-service-url>
```

#### Optional Variables (with defaults)

```
APP_ENV=production
MOCK_MODE=false
VECTOR_STORE=in_memory
RAG_TOP_K=5
RAG_CHUNK_SIZE=512
RAG_CHUNK_OVERLAP=50
MAX_TOKENS=2048
TEMPERATURE=0.1
SETU_REQUEST_TIMEOUT_SECONDS=60
```

### 5. Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy
3. Monitor the logs for any errors
4. Once deployed, note your service URL

### 6. Run Database Migrations

After deployment, you'll need to run migrations. You can:

**Option A: Use Render Shell**
```bash
# In Render Dashboard → Shell
# Run migration SQL files manually
```

**Option B: Connect locally and run migrations**
```bash
# Use the External Database URL from Render
psql <external-database-url>
# Run SQL files from Backend/migrations/
```

### 7. Test Your Deployment

```bash
# Health check
curl https://your-app.onrender.com/health/db

# API docs
open https://your-app.onrender.com/docs

# Test login
curl -X POST https://your-app.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"system_admin","password":"Admin@123"}'
```

## Troubleshooting

### Build Fails

- Check Python version compatibility in logs
- Verify all dependencies in requirements.txt are available
- Check for syntax errors in Python files

### Database Connection Issues

- Verify DATABASE_URL is correct
- Ensure database is in the same region as web service
- Check if tables are created

### Application Crashes

- Check logs in Render Dashboard
- Verify all required environment variables are set
- Check if AWS credentials are valid

### Slow Performance

- Consider upgrading Render plan
- Check database plan and upgrade if needed
- Monitor resource usage in dashboard

## Post-Deployment Checklist

- [ ] API health check returns 200
- [ ] Database connection works
- [ ] Can login with system admin credentials
- [ ] API documentation is accessible
- [ ] All environment variables are set
- [ ] HTTPS is working
- [ ] Change default admin password
- [ ] Set up monitoring/alerts
- [ ] Configure CORS if needed
- [ ] Set up backup strategy

## Updating Deployment

```bash
# Make changes locally
git add .
git commit -m "Update description"
git push origin main

# Render auto-deploys on push to main branch
```

## Scaling

To handle more traffic:
1. Upgrade your Render plan
2. Enable auto-scaling (available on paid plans)
3. Consider using Redis for caching
4. Optimize database queries
5. Use connection pooling

## Security Recommendations

1. **Change default credentials** in environment variables
2. **Use strong passwords** for system admin
3. **Enable HTTPS** (automatic on Render)
4. **Restrict CORS** to your frontend domain
5. **Rotate API keys** regularly
6. **Monitor logs** for suspicious activity
7. **Keep dependencies updated**
8. **Use secrets management** for sensitive data

## Support

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com/
- FastAPI Docs: https://fastapi.tiangolo.com/
