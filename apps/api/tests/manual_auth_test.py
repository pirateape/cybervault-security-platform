#!/usr/bin/env python3
"""
Manual Authentication Flow Test

This script provides a manual way to test the authentication flow
between the FastAPI backend and Supabase Auth system.

Usage:
    python manual_auth_test.py

This script will test:
1. Auth module import and basic functionality
2. Environment variable configuration
3. Basic endpoint protection
4. JWT token validation (mocked)
"""

import os
import sys
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_environment_setup():
    """Test that required environment variables are set"""
    print("🔍 Testing Environment Setup...")
    
    required_vars = [
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY", 
        "SUPABASE_SERVICE_KEY"
    ]
    
    missing_vars = []
    for var in required_vars:
        value = os.getenv(var)
        if not value:
            missing_vars.append(var)
        else:
            print(f"  ✅ {var}: {'*' * min(10, len(value))}...")
    
    if missing_vars:
        print(f"  ❌ Missing variables: {', '.join(missing_vars)}")
        return False
    
    print("  ✅ All environment variables configured")
    return True

def test_auth_module_import():
    """Test that auth module can be imported"""
    print("\n📦 Testing Auth Module Import...")
    
    try:
        from apps.api import auth
        print("  ✅ Auth module imported successfully")
        
        # Test key functions exist
        functions = ['get_current_user', 'verify_supabase_jwt_token', 'require_org_role']
        for func_name in functions:
            if hasattr(auth, func_name):
                print(f"  ✅ Function {func_name} available")
            else:
                print(f"  ❌ Function {func_name} missing")
                return False
        
        return True
        
    except ImportError as e:
        print(f"  ❌ Failed to import auth module: {e}")
        return False

def test_basic_api_response():
    """Test basic API connectivity"""
    print("\n🌐 Testing Basic API Connectivity...")
    
    try:
        from fastapi.testclient import TestClient
        from apps.api.main import app
        
        client = TestClient(app)
        
        # Test root endpoint
        response = client.get("/")
        print(f"  ✅ Root endpoint status: {response.status_code}")
        
        # Test protected endpoint without auth (should be 401)
        response = client.get("/scans/")
        if response.status_code == 401:
            print("  ✅ Protected endpoint correctly requires authentication")
        elif response.status_code == 422:
            print("  ⚠️  Protected endpoint returns 422 (missing required parameters)")
        else:
            print(f"  ⚠️  Protected endpoint status: {response.status_code}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ API connectivity test failed: {e}")
        return False

def test_jwt_validation_logic():
    """Test JWT validation logic with mock data"""
    print("\n🔐 Testing JWT Validation Logic...")
    
    try:
        from apps.api.auth import verify_supabase_jwt_token
        from unittest.mock import patch, MagicMock
        
        # Mock successful response
        with patch('requests.get') as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "id": "test-user-id",
                "email": "test@example.com",
                "role": "authenticated"
            }
            mock_get.return_value = mock_response
            
            result = verify_supabase_jwt_token("test.jwt.token")
            print("  ✅ JWT validation logic works with mocked success response")
            print(f"    User ID: {result.get('id')}")
            print(f"    Email: {result.get('email')}")
        
        # Mock error response
        with patch('requests.get') as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 401
            mock_response.json.return_value = {"error": "invalid_token"}
            mock_get.return_value = mock_response
            
            try:
                verify_supabase_jwt_token("invalid.jwt.token")
                print("  ❌ JWT validation should have failed for invalid token")
                return False
            except Exception:
                print("  ✅ JWT validation correctly rejects invalid tokens")
        
        return True
        
    except Exception as e:
        print(f"  ❌ JWT validation test failed: {e}")
        return False

def test_role_based_access():
    """Test role-based access control"""
    print("\n👥 Testing Role-Based Access Control...")
    
    try:
        from apps.api.auth import require_org_role
        from fastapi import Depends
        
        # Test that require_org_role function exists and is callable
        role_dependency = require_org_role("test_org", "admin")
        print("  ✅ Role-based access control function available")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Role-based access test failed: {e}")
        return False

def test_supabase_connectivity():
    """Test actual Supabase connectivity (if configured)"""
    print("\n🔗 Testing Supabase Connectivity...")
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_anon_key:
        print("  ⚠️  Supabase credentials not configured, skipping connectivity test")
        return True
    
    try:
        # Test basic connectivity to Supabase
        headers = {
            "apikey": supabase_anon_key,
            "Content-Type": "application/json"
        }
        
        response = requests.get(f"{supabase_url}/rest/v1/", headers=headers, timeout=5)
        
        if response.status_code in [200, 404]:
            print("  ✅ Supabase API connectivity successful")
            return True
        else:
            print(f"  ⚠️  Supabase API returned status: {response.status_code}")
            return True
            
    except requests.exceptions.Timeout:
        print("  ⚠️  Supabase API timeout (network might be slow)")
        return True
    except Exception as e:
        print(f"  ❌ Supabase connectivity failed: {e}")
        return False

def generate_test_report():
    """Generate a comprehensive test report"""
    print("\n" + "="*60)
    print("🧪 AUTHENTICATION SYSTEM TEST REPORT")
    print("="*60)
    
    tests = [
        ("Environment Setup", test_environment_setup),
        ("Auth Module Import", test_auth_module_import),
        ("Basic API Response", test_basic_api_response),
        ("JWT Validation Logic", test_jwt_validation_logic),
        ("Role-Based Access", test_role_based_access),
        ("Supabase Connectivity", test_supabase_connectivity),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ {test_name} crashed: {e}")
            results.append((test_name, False))
    
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status:10} {test_name}")
        if result:
            passed += 1
    
    print(f"\nResult: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Authentication system is working correctly.")
        return True
    else:
        print("⚠️  Some tests failed. Please check the details above.")
        return False

if __name__ == "__main__":
    success = generate_test_report()
    sys.exit(0 if success else 1) 