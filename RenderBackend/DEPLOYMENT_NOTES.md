# Important Deployment Notes

## AI Features Configuration

The RenderBackend has been optimized for deployment with the following considerations:

### 🔧 Requirements Simplified

The `requirements.txt` has been streamlined to **avoid Rust compilation issues** on Render:

**Removed packages (causing build failures):**
- `tiktoken` - Requires Rust compiler
- `sentence-transformers` - Heavy ML package with Rust dependencies
- `torch` / `transformers` - Large ML frameworks

**Why this works:**
- The AI agent features are **optional** in the codebase
- All AI imports are wrapped in `try-except` blocks
- The app runs perfectly without these packages
- Core features (auth, API, database) work 100%

### ✅ What Works Out of the Box

- ✅ User authentication (JWT)
- ✅ Borrower management
- ✅ Loan applications
- ✅ Document upload (S3)
- ✅ Workflow management
- ✅ Database operations
- ✅ Setu API integration
- ✅ All REST APIs

### ⚠️ Features Requiring Additional Setup

The following features require the full AI packages and will be **skipped gracefully**:

- AI document verification (`/loan-officer/documents/{arn}/verify` endpoint)
- ML-based risk scoring
- RAG-based knowledge retrieval

**To enable AI features later:**
1. Deploy successfully first with current requirements.txt
2. Then uncomment AI packages in requirements.txt
3. Redeploy

### 🚀 Recommended Deployment Strategy

**Phase 1: Get It Running** (Current Setup)
```bash
Build Command: pip install --upgrade pip && pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Phase 2: Add AI Features** (After successful deployment)
1. Upgrade to a larger Render plan (Standard or higher)
2. Add AI packages back to requirements.txt
3. Increase build timeout if needed
4. Set `MOCK_MODE=false`

## Build Command Explanation

```bash
pip install --upgrade pip && pip install -r requirements.txt
```

This:
1. Upgrades pip to latest version
2. Installs all dependencies
3. Uses pre-built wheels where available
4. Avoids compilation when possible

## Environment Variables Priority

### Minimum Required (to deploy):
```bash
DATABASE_URL=postgresql://...
SYSTEM_ADMIN_USERNAME=system_admin
SYSTEM_ADMIN_PASSWORD=Admin@123
APP_ENV=production
MOCK_MODE=true
```

### Add for Full Features:
```bash
# AWS (for S3 document storage)
AWS_ACCESS_KEY=...
AWS_SECRET_KEY=...
AWS_BUCKET_NAME=...
STORAGE_URL=...

# Setu (for financial data)
SETU_CLIENT_ID=...
SETU_CLIENT_SECRET=...
SETU_PRODUCT_INSTANCE_ID=...
```

### Add for AI Features (Phase 2):
```bash
# AWS Bedrock
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
BEDROCK_MODEL_ID=...
MOCK_MODE=false
```

## Troubleshooting Build Errors

### Error: "maturin failed" or "Rust compiler required"

**Solution:** This means a package requires Rust compilation. Check that you're using the simplified `requirements.txt` from RenderBackend (not Backend).

### Error: "Memory limit exceeded during build"

**Solution:** 
1. Upgrade Render plan to get more build resources
2. Or keep using simplified requirements.txt

### Error: "Build timeout"

**Solution:**
1. Use simplified requirements.txt (faster build)
2. Or increase build timeout in Render settings
3. Or upgrade Render plan

## Performance Considerations

**Current Setup:**
- Build time: ~3-5 minutes
- Cold start: ~10 seconds
- Memory usage: ~300-400 MB
- **Works on:** Free tier ✅

**With Full AI:**
- Build time: ~15-20 minutes
- Cold start: ~30-60 seconds
- Memory usage: ~2-3 GB
- **Requires:** Standard plan or higher

## Migration Path: Current → Full AI

When you're ready to enable AI features:

1. **Update requirements.txt:**
```bash
# Uncomment these lines in requirements.txt:
# tiktoken==0.7.0
# sentence-transformers==3.0.1
# torch==2.3.1
# transformers==4.44.2
```

2. **Update environment variables:**
```bash
MOCK_MODE=false
AWS_ACCESS_KEY_ID=your_actual_key
AWS_SECRET_ACCESS_KEY=your_actual_secret
BEDROCK_MODEL_ID=us.meta.llama4-maverick-17b-instruct-v1:0
```

3. **Upgrade Render plan** to Standard or higher

4. **Push changes** - Render will auto-deploy

## Summary

✅ **Current setup = Fast, reliable deployment**
- No compilation issues
- Works on free tier
- Core features fully functional

⏭️ **Future setup = Full AI capabilities**
- Requires larger instance
- Longer build times
- Complete feature set

Start with Phase 1, verify everything works, then upgrade to Phase 2 when needed.
