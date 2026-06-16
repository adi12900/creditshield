# Render Configuration - Copy These Exact Settings

## ⚠️ IMPORTANT: Root Directory

When deploying to Render, you MUST specify the root directory because your repository contains multiple folders.

---

## Render Dashboard Settings

### Step 1: Create New Web Service

Go to Render Dashboard → Click "New +" → Select "Web Service"

### Step 2: Connect Repository

Connect to: `https://github.com/adi12900/creditshield`

### Step 3: Configure Service - COPY THESE EXACT VALUES

```
┌─────────────────────────────────────────────────────────────┐
│ SERVICE CONFIGURATION                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Name:              creditshield-backend                      │
│                                                              │
│ Region:            Singapore                                 │
│                                                              │
│ Branch:            aditya                                    │
│                                                              │
│ Root Directory:    RenderBackend          ⚠️ CRITICAL!      │
│                    ^^^^^^^^^^^                               │
│                    Don't leave this empty!                   │
│                                                              │
│ Runtime:           Python 3                                  │
│                                                              │
│ Build Command:     pip install -r requirements.txt           │
│                                                              │
│ Start Command:     uvicorn app.main:app --host 0.0.0.0      │
│                    --port $PORT                              │
│                                                              │
│ Instance Type:     Free / Starter / Standard                 │
│                    (Choose based on your needs)              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Why Root Directory is Critical

Your repository structure:
```
creditshield/
├── Backend/              ← Original backend (don't use)
├── RenderBackend/        ← Clean deployment version (use this!)
│   ├── app/
│   ├── requirements.txt
│   ├── render.yaml
│   └── ...
├── Frontend/
└── ai_agent/
```

**Without Root Directory:**
- Render looks in repository root
- Can't find `app/` folder
- Can't find `requirements.txt`
- ❌ Build fails

**With Root Directory = RenderBackend:**
- Render looks inside RenderBackend folder
- ✅ Finds `app/` folder
- ✅ Finds `requirements.txt`
- ✅ Build succeeds

---

## Step 4: Environment Variables

After configuring the service, add these environment variables:

### Minimum Required (to get started):

```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname
SYSTEM_ADMIN_USERNAME=system_admin
SYSTEM_ADMIN_PASSWORD=Admin@123
APP_ENV=production
```

### Complete List (for full functionality):

See RENDER_CONFIG.md for the complete list of all environment variables.

---

## Step 5: Deploy

Click "Create Web Service" and Render will:
1. Clone your repository
2. Navigate to `RenderBackend` folder
3. Run `pip install -r requirements.txt`
4. Start server with uvicorn
5. Make it available at `https://your-app.onrender.com`

---

## Verification Checklist

After deployment:

- [ ] Service status shows "Live" (green)
- [ ] No errors in logs
- [ ] Health check works: `https://your-app.onrender.com/health/db`
- [ ] API docs accessible: `https://your-app.onrender.com/docs`
- [ ] Can login with system admin credentials

---

## Common Mistakes to Avoid

### ❌ Mistake #1: Empty Root Directory
```
Root Directory: [empty]
```
**Result:** Build fails - can't find app folder

### ✅ Correct:
```
Root Directory: RenderBackend
```

---

### ❌ Mistake #2: Wrong Root Directory
```
Root Directory: Backend
```
**Result:** Uses old Backend folder (not the clean one)

### ✅ Correct:
```
Root Directory: RenderBackend
```

---

### ❌ Mistake #3: Wrong Start Command
```
Start Command: uvicorn app.main:app
```
**Result:** Port binding error

### ✅ Correct:
```
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

### ❌ Mistake #4: Hardcoded Port
```
Start Command: uvicorn app.main:app --port 8000
```
**Result:** Application won't start (Render uses dynamic ports)

### ✅ Correct:
```
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
                                                           ^^^^
                                                   Use $PORT variable
```

---

## Quick Copy-Paste

**Root Directory:**
```
RenderBackend
```

**Build Command:**
```
pip install -r requirements.txt
```

**Start Command:**
```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## Need Help?

If deployment fails:
1. Check logs in Render Dashboard
2. Verify Root Directory is set to `RenderBackend`
3. Verify all required environment variables are set
4. Check that DATABASE_URL is correct
5. Review DEPLOYMENT_GUIDE.md for detailed troubleshooting

---

## Summary

🔑 **Key Point:** Always set **Root Directory** to `RenderBackend`

This tells Render to look inside the RenderBackend folder where all the deployment-ready files are located.
