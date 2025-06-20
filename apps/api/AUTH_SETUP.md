# Authentication Setup Documentation

## Overview
The authentication system has been unified to use Supabase Auth exclusively for JWT verification and user management.

## Environment Variables
Required environment variables for authentication:

```bash
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

## JWT Verification Process

The authentication system now uses a single, streamlined verification process:

1. **Primary**: Direct JWT verification using Supabase Auth API via `verify_supabase_jwt_token()`

This approach ensures:
- Direct integration with Supabase Auth service
- Real-time token validation
- Automatic handling of token expiration
- Consistent user data retrieval

## Authentication Flow

1. User logs in via frontend (Supabase client)
2. Frontend receives JWT token from Supabase
3. Frontend includes token in Authorization header for API requests
4. FastAPI extracts token using HTTPBearer scheme
5. Token is verified against Supabase Auth API
6. User data is returned for authorized requests

## Dependencies

The authentication system uses:
- `fastapi.security.HTTPBearer` for token extraction
- Supabase Auth API for token verification
- Organization membership validation via `org_members` table

## Role-Based Access Control

Use the `require_org_role()` dependency for endpoint protection:

```python
@app.get("/admin-endpoint")
async def admin_only(
    org_context = Depends(require_org_role("org_id", "admin"))
):
    # Only admins can access this endpoint
    pass
```

## Migration Notes

- Removed dependency on `python-jose` library
- Removed `SUPABASE_JWT_SECRET` environment variable
- Simplified verification to single Supabase Auth API call
- Enhanced error handling and retry logic

## API Endpoints

### Authentication Endpoints

- `POST /token` - Login and get access token
- `POST /users/` - User registration
- `POST /api/admin/reset-password` - Admin password reset

### Protected Endpoints

All endpoints using `Depends(auth.get_current_user)` now use Supabase JWT verification.

## Frontend Integration

The frontend should use the Supabase client to:

1. Authenticate users
2. Get JWT tokens
3. Include tokens in API requests

Example frontend API call:
```typescript
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token

const response = await fetch('http://localhost:8000/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

## Security Features

### Audit Logging
- All authentication events are logged
- Failed authentication attempts tracked
- User access patterns monitored

### Role-Based Access Control (RBAC)
- Organization-based permissions
- Hierarchical role system
- Service key separation for admin operations

### Error Handling
- Comprehensive error logging
- Secure error messages (no sensitive data exposure)
- Proper HTTP status codes

## Testing

### Manual Testing

1. Start FastAPI server: `uvicorn main:app --reload`
2. Test authentication endpoint: `POST /token`
3. Use token in protected endpoint: `GET /users/me`

### Integration Testing

The authentication system integrates with:
- Supabase Auth API
- Frontend Supabase client
- Database RLS policies
- Audit logging system

## Troubleshooting

### Common Issues

1. **Invalid Token**: Check SUPABASE_URL and SUPABASE_KEY
2. **Service Key Errors**: Verify SUPABASE_SERVICE_KEY has admin permissions
3. **CORS Issues**: Ensure frontend URL is in CORS allowed origins
4. **Role Permissions**: Check org_members table for user roles

### Debugging

Enable debug logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

Check authentication logs in application output for detailed error information. 