# Render Deployment Configuration

## Complete Render Setup Guide

### Basic Service Configuration

**Service Type:** Web Service

**Environment:** Python 3

**Region:** Singapore (or closest to your users)

**Branch:** aditya (or main)

**Root Directory:** RenderBackend

---

## Build & Start Commands

### Build Command
```bash
pip install -r requirements.txt
```

### Start Command
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Note:** Render automatically sets the `$PORT` environment variable

---

## Environment Variables Configuration

Copy and paste these into Render Dashboard → Environment Variables

### Essential Variables (Required)

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# System Admin
SYSTEM_ADMIN_USERNAME=system_admin
SYSTEM_ADMIN_PASSWORD=Admin@123
SYSTEM_ADMIN_FULL_NAME=System Administrator

# App Settings
APP_NAME=CreditShield Backend
APP_ENV=production
```

### Setu API Variables (Required for Financial Features)

```bash
SETU_BASE_URL=https://fiu-sandbox.setu.co
SETU_PRODUCTION_BASE_URL=https://fiu.setu.co
SETU_CLIENT_ID=your_client_id_here
SETU_CLIENT_SECRET=your_client_secret_here
SETU_PRODUCT_INSTANCE_ID=your_product_instance_id_here
SETU_TOKEN_URL=https://orgservice-prod.setu.co/v1/users/login
SETU_CONSENT_PATH=/v2/consents
SETU_CONSENT_GET_PATH_TEMPLATE=/v2/consents/{request_id}
SETU_SESSIONS_PATH=/v2/sessions
SETU_SESSIONS_GET_PATH_TEMPLATE=/v2/sessions/{session_id}
SETU_REQUEST_TIMEOUT_SECONDS=60
```

### AWS Bedrock (Required for AI Features)

```bash
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
BEDROCK_MODEL_ID=us.meta.llama4-maverick-17b-instruct-v1:0
BEDROCK_EMBEDDING_MODEL=amazon.titan-embed-text-v2:0
```

### AWS S3 Storage (Required for Document Upload)

```bash
AWS_ACCESS_KEY=your_s3_access_key
AWS_SECRET_KEY=your_s3_secret_key
AWS_REGIONS3=ap-south-1
AWS_BUCKET_NAME=your-bucket-name
STORAGE_URL=https://your-bucket.s3.ap-south-1.amazonaws.com
```

### AI/ML Configuration (Default Values)

```bash
MOCK_MODE=false
VECTOR_STORE=in_memory
RAG_TOP_K=5
RAG_CHUNK_SIZE=512
RAG_CHUNK_OVERLAP=50
MAX_TOKENS=2048
TEMPERATURE=0.1
```

### Service URLs (Update After Deployment)

```bash
BACKEND_BASE_URL=https://your-app.onrender.com
FRONTEND_BASE_URL=https://your-frontend.com
OTP_SERVICE_URL=http://your-otp-service-url
```

### Optional - Email/SMS Services

```bash
# Twilio (Optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# SMTP (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

---

## Health Check Configuration

**Health Check Path:** `/health/db`

**Expected Response:** 
```json
{"status":"ok","database":"connected"}
```

---

## Auto-Deploy Settings

✅ **Enable Auto-Deploy:** ON (deploys automatically when you push to branch)

---

## Docker Configuration (Not Required)

Render can build directly from requirements.txt. Docker is optional.

If you want to use Docker:
- Dockerfile is available in Backend folder
- Can be copied to RenderBackend if needed

---

## Instance Type

**Starter Plan:** Free (512 MB RAM, sleeps after inactivity)

**Standard Plans:**
- Starter: $7/month - 512 MB RAM
- Standard: $25/month - 2 GB RAM  
- Pro: $85/month - 4 GB RAM

**Recommendation:** Start with free tier for testing, upgrade to Standard for production.

---

## Python Version

Render auto-detects Python version. To specify:

**Option 1:** Add to environment variables:
```bash
PYTHON_VERSION=3.11.0
```

**Option 2:** Create `runtime.txt` in RenderBackend:
```
python-3.11.0
```

---

## Quick Copy-Paste Config

### For Render Dashboard "New Web Service" Form:

| Field | Value |
|-------|-------|
| **Name** | creditshield-backend |
| **Region** | Singapore |
| **Branch** | aditya |
| **Root Directory** | RenderBackend |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | Free (or your choice) |

---

## Post-Deployment Steps

1. **Get Your URL**: `https://creditshield-backend.onrender.com` (or your custom name)

2. **Update Environment Variables**:
   ```bash
   BACKEND_BASE_URL=https://your-actual-url.onrender.com
   ```

3. **Test Health Check**:
   ```bash
   curl https://your-app.onrender.com/health/db
   ```

4. **Access API Docs**:
   ```
   https://your-app.onrender.com/docs
   ```

5. **Run Database Migrations** (if needed):
   - Use Render Shell or connect via psql
   - Run SQL files from Backend/migrations/

6. **Test Authentication**:
   ```bash
   curl -X POST https://your-app.onrender.com/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"system_admin","password":"Admin@123"}'
   ```

---

## Common Issues & Solutions

### Issue: Build Fails
**Solution:** Check that all dependencies in requirements.txt are valid

### Issue: Application Crashes on Start
**Solution:** 
- Verify DATABASE_URL is correct
- Check all required environment variables are set
- Review logs in Render Dashboard

### Issue: Database Connection Failed
**Solution:**
- Use Internal Database URL (not External) from Render PostgreSQL
- Ensure database is in same region as web service
- Check DATABASE_URL format: `postgresql://user:password@host:5432/dbname`

### Issue: Port Binding Error
**Solution:** Always use `--port $PORT` in start command (Render sets this automatically)

### Issue: Application Works Locally But Not on Render
**Solution:**
- Check environment variables are set correctly
- Review logs for missing dependencies
- Verify AWS credentials have correct permissions

---

## Monitoring & Logs

- **Logs:** Available in Render Dashboard → Logs tab
- **Metrics:** Available in Render Dashboard → Metrics tab
- **Shell Access:** Available in Render Dashboard → Shell tab

---

## Scaling Recommendations

**For Development:**
- Free tier is sufficient
- Database: Free PostgreSQL

**For Production:**
- Web Service: Standard ($25/month) or higher
- Database: Starter ($7/month) or higher
- Enable Auto-Deploy
- Set up health check alerts
- Configure custom domain

---

## Security Checklist

- [ ] Change SYSTEM_ADMIN_PASSWORD from default
- [ ] Use strong, unique passwords
- [ ] Enable HTTPS (automatic on Render)
- [ ] Rotate API keys regularly
- [ ] Use Render's secret environment variables (don't commit to git)
- [ ] Set up CORS for your frontend domain
- [ ] Enable database backups
- [ ] Monitor logs for suspicious activity

---

## Need Help?

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com/
- Check TEST_RESULTS.md for local testing reference
- Review DEPLOYMENT_GUIDE.md for detailed steps
