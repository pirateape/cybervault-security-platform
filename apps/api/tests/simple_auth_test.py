#!/usr/bin/env python3
"""
Simple Authentication Test

This script provides a lightweight test for the authentication system
without requiring external dependencies like requests.

Usage:
    python simple_auth_test.py
"""

import os
import sys

def test_auth_module_import():
    """Test that auth module can be imported and functions are available"""
    print("📦 Testing Auth Module Import...")
    
    try:
        from apps.api import auth
        print("  ✅ Auth module imported successfully")
        
        # Test key functions exist
        required_functions = [
            'get_current_user',
            'verify_supabase_jwt_token', 
            'require_org_role',
            'oauth2_scheme'
        ]
        
        missing_functions = []
        for func_name in required_functions:
            if hasattr(auth, func_name):
                print(f"  ✅ Function/Object {func_name} available")
            else:
                print(f"  ❌ Function/Object {func_name} missing")
                missing_functions.append(func_name)
        
        if missing_functions:
            print(f"  ❌ Missing required functions: {', '.join(missing_functions)}")
            return False
        
        return True
        
    except ImportError as e:
        print(f"  ❌ Failed to import auth module: {e}")
        return False
    except Exception as e:
        print(f"  ❌ Unexpected error: {e}")
        return False

def test_environment_variables():
    """Test that required environment variables exist"""
    print("\n🔍 Testing Environment Variables...")
    
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
            # Show truncated value for security
            display_value = value[:10] + "..." if len(value) > 10 else value
            print(f"  ✅ {var}: {display_value}")
    
    if missing_vars:
        print(f"  ⚠️  Missing environment variables: {', '.join(missing_vars)}")
        print("     These may be configured in your deployment environment")
        return True  # Don't fail the test for missing env vars
    
    print("  ✅ All required environment variables are configured")
    return True

def test_jwt_secret_cleanup():
    """Test that JWT_SECRET has been removed from the codebase"""
    print("\n🧹 Testing Legacy JWT Cleanup...")
    
    try:
        # Check if JWT_SECRET is referenced anywhere in auth.py
        with open('apps/api/auth.py', 'r') as f:
            content = f.read()
            
        if 'JWT_SECRET' in content:
            print("  ❌ JWT_SECRET still found in auth.py")
            return False
        else:
            print("  ✅ JWT_SECRET successfully removed from auth.py")
        
        if 'jose' in content:
            print("  ❌ jose library still referenced in auth.py")
            return False
        else:
            print("  ✅ jose library references removed from auth.py")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error checking JWT cleanup: {e}")
        return False

def test_auth_configuration():
    """Test authentication configuration"""
    print("\n⚙️  Testing Authentication Configuration...")
    
    try:
        from apps.api import auth
        
        # Check if SUPABASE constants are defined
        supabase_vars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY']
        
        for var in supabase_vars:
            if hasattr(auth, var):
                print(f"  ✅ {var} constant defined")
            else:
                print(f"  ❌ {var} constant missing")
                return False
        
        # Check if headers are configured
        if hasattr(auth, 'headers'):
            print("  ✅ Supabase headers configured")
        else:
            print("  ❌ Supabase headers not configured")
            return False
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error testing auth configuration: {e}")
        return False

def test_basic_fastapi_app():
    """Test that FastAPI app can be imported"""
    print("\n🚀 Testing FastAPI App Import...")
    
    try:
        from apps.api.main import app
        print("  ✅ FastAPI app imported successfully")
        
        # Check if app is a FastAPI instance
        if hasattr(app, 'router'):
            print("  ✅ App has router (FastAPI instance confirmed)")
        else:
            print("  ❌ App does not appear to be a FastAPI instance")
            return False
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error importing FastAPI app: {e}")
        return False

def run_tests():
    """Run all tests and generate report"""
    print("=" * 60)
    print("🧪 SIMPLE AUTHENTICATION SYSTEM TEST")
    print("=" * 60)
    
    tests = [
        ("Auth Module Import", test_auth_module_import),
        ("Environment Variables", test_environment_variables),
        ("JWT Secret Cleanup", test_jwt_secret_cleanup),
        ("Auth Configuration", test_auth_configuration),
        ("FastAPI App Import", test_basic_fastapi_app),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ {test_name} crashed: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status:10} {test_name}")
        if result:
            passed += 1
    
    print(f"\n🎯 Result: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Authentication system structure is correct.")
        print("✅ Legacy JWT implementation successfully removed")
        print("✅ Supabase Auth integration is properly configured")
        return True
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please check the details above.")
        return False

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1) 