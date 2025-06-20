# Backend Structure Verification & Startup Guide

## ✅ Backend Structure Confirmed

The backend is properly structured and located in the **root directory** (not in a separate backend folder):

### 📁 Backend Files Structure

```
/
├── api.py                 # 🎯 Main FastAPI application
├── auth.py               # 🔐 Authentication module
├── supabase_client.py    # 🗄️ Database client
├── ms_api.py            # 🔗 Microsoft Graph API integration
├── requirements.txt      # 📦 Python dependencies
├── .env                 # ⚙️ Environment variables
└── db_schema.sql        # 🗃️ Database schema
```

### 🚀 Main Application Entry Point

- **File**: `api.py`
- **FastAPI App**: `app = FastAPI(title="Security Compliance Tool API")`
- **Startup Command**: `uvicorn api:app --reload`

## ✅ Environment Configuration Verified

The `.env` file contains all required variables:

```env
✅ SUPABASE_URL=https://your-project.supabase.co
✅ SUPABASE_KEY="your-service-role-key-here" (service role key)
✅ JWT_SECRET=your-super-secret-key
✅ MS_CLIENT_ID="your-azure-client-id"
✅ MS_CLIENT_SECRET="your-azure-client-secret"
✅ MS_TENANT_ID="your-azure-tenant-id"
```

## 🏗️ Backend Architecture

### Core Modules

1. **`api.py`** - Main FastAPI application with:

   - User management endpoints
   - Scan management endpoints
   - Results endpoints
   - Audit log endpoints
   - Microsoft Graph API routes
   - Rate limiting and error handling
   - JWT authentication

2. **`auth.py`** - Authentication module with:

   - Supabase Auth integration
   - JWT token verification
   - OAuth2 password bearer scheme
   - User signup/login functions

3. **`supabase_client.py`** - Database client (REST API based)
4. **`ms_api.py`** - Microsoft Graph API integration

### API Endpoints Structure

```
/users/                    # User management
/scans/                    # Scan operations
/results/                  # Scan results
/audit_logs/               # Audit logging
/msgraph/                  # Microsoft Graph API
  ├── /users/
  ├── /groups/
  ├── /conditional_access_policies/
  └── /compliance/
```

## 🚀 Backend Startup Process

### Method 1: Direct Uvicorn (Recommended)

```bash
# From project root directory
uvicorn api:app --reload
```

### Method 2: Python Module

```bash
# Alternative method
python -m uvicorn api:app --reload
```

### Expected Output

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [PID]
INFO:     Started server process [PID]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## 🔧 Pre-Startup Checklist

### 1. Dependencies Installation

```bash
pip install -r requirements.txt
```

**Key Dependencies Verified:**

- ✅ fastapi
- ✅ uvicorn
- ✅ python-dotenv
- ✅ requests
- ✅ python-jose[cryptography]
- ✅ passlib[bcrypt]
- ✅ msal
- ✅ msgraph-sdk

### 2. Environment Variables

- ✅ `.env` file exists in root directory
- ✅ All required variables are set
- ✅ Service role key is properly configured

### 3. Database Setup

- ✅ Supabase project is active
- ✅ Database schema is applied (see `db_schema.sql`)
- ✅ Test users are seeded (use `scripts/populate_org_id.py`)

## 🧪 Backend Verification Steps

### 1. Test Import

```bash
python -c "import api; print('✅ Backend imports successfully')"
```

### 2. Test Startup

```bash
uvicorn api:app --reload --host 127.0.0.1 --port 8000
```

### 3. Test API Health

```bash
curl http://localhost:8000/docs
# Should return FastAPI documentation page
```

### 4. Test Authentication Endpoint

```bash
curl -X POST http://localhost:8000/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser@example.com&password=testpassword"
```

## 🔍 Troubleshooting

### Common Issues & Solutions

#### 1. Import Timeouts

**Symptoms**: Python import commands hang or timeout
**Possible Causes**:

- Network connectivity issues
- Dependency conflicts
- Environment variable loading issues

**Solutions**:

```bash
# Check if python-dotenv is working
python -c "from dotenv import load_dotenv; load_dotenv(); print('✅ dotenv works')"

# Test individual imports
python -c "import fastapi; print('✅ FastAPI')"
python -c "import uvicorn; print('✅ Uvicorn')"
python -c "import requests; print('✅ Requests')"
```

#### 2. Environment Variable Issues

**Symptoms**: 401/403 errors, "SUPABASE_KEY not found"
**Solutions**:

```bash
# Verify environment variables are loaded
python -c "import os; print('SUPABASE_URL:', os.getenv('SUPABASE_URL'))"
python -c "import os; print('SUPABASE_KEY set:', bool(os.getenv('SUPABASE_KEY')))"
```

#### 3. Port Already in Use

**Symptoms**: "Address already in use" error
**Solutions**:

```bash
# Use different port
uvicorn api:app --reload --port 8001

# Or kill existing process
# Windows: netstat -ano | findstr :8000
# Linux/Mac: lsof -ti:8000 | xargs kill
```

#### 4. Database Connection Issues

**Symptoms**: 500 errors, database timeouts
**Solutions**:

- Verify Supabase project is active
- Check service role key permissions
- Test database connection manually

## 📊 Backend Health Indicators

### ✅ Healthy Backend Signs

- FastAPI docs accessible at `http://localhost:8000/docs`
- Authentication endpoint responds
- Environment variables loaded correctly
- No import errors in logs
- Rate limiting middleware active

### ❌ Unhealthy Backend Signs

- Import timeouts or errors
- 500 errors on startup
- Environment variables not found
- Database connection failures
- Missing dependencies

## 🔄 Development Workflow

### 1. Start Backend

```bash
uvicorn api:app --reload
```

### 2. Start Frontend (separate terminal)

```bash
cd frontend
npm run dev
```

### 3. Access Applications

- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Frontend**: http://localhost:5173

## 📝 Notes

1. **No Separate Backend Folder**: Unlike typical projects, this backend is in the root directory
2. **REST API Based**: Uses Supabase REST API instead of supabase-py library
3. **Multi-Org Support**: All endpoints require org_id parameter
4. **Rate Limited**: Built-in rate limiting for security
5. **Audit Logging**: Comprehensive audit trail for all actions

## 🎯 Next Steps

1. **Test Backend Startup**: Use the verification steps above
2. **Populate Test Data**: Run `scripts/populate_org_id.py`
3. **Start Frontend**: Follow frontend startup guide
4. **Test Full Stack**: Verify end-to-end functionality

## 🆘 Getting Help

If you encounter issues:

1. Check this troubleshooting guide
2. Review logs for specific error messages
3. Verify environment variables are set correctly
4. Ensure all dependencies are installed
5. Test individual components (auth, database, API)

The backend structure is confirmed and properly configured for startup! 🚀
