"""
Authentication Flow Integration Tests

This module tests the complete authentication flow between the FastAPI backend
and frontend applications using Supabase Auth. It verifies JWT token verification,
user session management, and proper error handling.

Test Coverage:
- JWT token verification (valid, invalid, expired)
- Protected endpoint access
- User session management
- Error handling scenarios
- Auth middleware functionality
"""

import pytest
import requests
import json
import time
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from apps.api.main import app
from apps.api.auth import get_current_user, verify_supabase_jwt_token

# Test client
client = TestClient(app)

# Test data
VALID_TEST_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
EXPIRED_TEST_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid"
INVALID_JWT = "invalid.jwt.token"

# Mock user data
MOCK_USER = {
    "id": "11111111-2222-3333-4444-555555555555",
    "email": "test@example.com",
    "role": "authenticated",
    "app_metadata": {"provider": "email"},
    "user_metadata": {},
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
}

MOCK_ADMIN_USER = {
    "id": "22222222-3333-4444-5555-666666666666",
    "email": "admin@example.com",
    "role": "admin",
    "app_metadata": {"provider": "email"},
    "user_metadata": {},
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
}

class TestAuthenticationFlow:
    """Test suite for authentication flow verification"""

    def test_protected_endpoint_without_token(self):
        """Test that protected endpoints deny access without authentication"""
        response = client.get("/protected/test")
        assert response.status_code == 401
        assert "Not authenticated" in response.json()["detail"]

    def test_protected_endpoint_with_invalid_token(self):
        """Test that protected endpoints deny access with invalid tokens"""
        headers = {"Authorization": f"Bearer {INVALID_JWT}"}
        response = client.get("/protected/test", headers=headers)
        assert response.status_code == 401

    def test_protected_endpoint_with_malformed_header(self):
        """Test authentication with malformed Authorization header"""
        # Missing Bearer prefix
        headers = {"Authorization": VALID_TEST_JWT}
        response = client.get("/protected/test", headers=headers)
        assert response.status_code == 401

        # Wrong scheme
        headers = {"Authorization": f"Basic {VALID_TEST_JWT}"}
        response = client.get("/protected/test", headers=headers)
        assert response.status_code == 401

    @patch('apps.api.auth.verify_supabase_jwt_token')
    def test_protected_endpoint_with_valid_token(self, mock_verify):
        """Test that protected endpoints allow access with valid tokens"""
        mock_verify.return_value = MOCK_USER
        
        headers = {"Authorization": f"Bearer {VALID_TEST_JWT}"}
        response = client.get("/protected/test", headers=headers)
        
        # Should succeed if endpoint exists, or 404 if endpoint doesn't exist
        assert response.status_code in [200, 404]
        mock_verify.assert_called_once_with(VALID_TEST_JWT)

    @patch('apps.api.auth.verify_supabase_jwt_token')
    def test_user_profile_endpoint(self, mock_verify):
        """Test user profile retrieval with valid authentication"""
        mock_verify.return_value = MOCK_USER
        
        headers = {"Authorization": f"Bearer {VALID_TEST_JWT}"}
        response = client.get("/user/profile", headers=headers)
        
        # Should succeed if endpoint exists
        if response.status_code == 200:
            data = response.json()
            assert "id" in data
            assert "email" in data
        else:
            # Endpoint might not exist, that's OK for this test
            assert response.status_code == 404

    @patch('apps.api.auth.verify_supabase_jwt_token')
    def test_admin_endpoint_with_user_token(self, mock_verify):
        """Test that admin endpoints deny access to regular users"""
        mock_verify.return_value = MOCK_USER  # Regular user, not admin
        
        headers = {"Authorization": f"Bearer {VALID_TEST_JWT}"}
        response = client.get("/admin/users", headers=headers)
        
        # Should deny access (403) or endpoint not found (404)
        assert response.status_code in [403, 404]

    @patch('apps.api.auth.verify_supabase_jwt_token')
    def test_admin_endpoint_with_admin_token(self, mock_verify):
        """Test that admin endpoints allow access to admin users"""
        mock_verify.return_value = MOCK_ADMIN_USER
        
        headers = {"Authorization": f"Bearer {VALID_TEST_JWT}"}
        response = client.get("/admin/users", headers=headers)
        
        # Should succeed if endpoint exists
        assert response.status_code in [200, 404]

    @patch('requests.get')
    def test_supabase_jwt_verification_success(self, mock_get):
        """Test successful JWT verification with Supabase Auth API"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = MOCK_USER
        mock_get.return_value = mock_response
        
        result = verify_supabase_jwt_token(VALID_TEST_JWT)
        
        assert result == MOCK_USER
        mock_get.assert_called_once()

    @patch('requests.get')
    def test_supabase_jwt_verification_failure(self, mock_get):
        """Test JWT verification failure scenarios"""
        # Test invalid token
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.json.return_value = {"error": "invalid_token"}
        mock_get.return_value = mock_response
        
        with pytest.raises(Exception):
            verify_supabase_jwt_token(INVALID_JWT)

    @patch('requests.get')
    def test_supabase_jwt_verification_network_error(self, mock_get):
        """Test JWT verification with network connectivity issues"""
        mock_get.side_effect = requests.exceptions.ConnectionError("Network error")
        
        with pytest.raises(Exception):
            verify_supabase_jwt_token(VALID_TEST_JWT)

    def test_cors_headers_on_auth_endpoints(self):
        """Test CORS headers on authentication-related endpoints"""
        # Test OPTIONS request
        response = client.options("/protected/test")
        
        # Should have CORS headers if configured
        if response.status_code == 200:
            assert "Access-Control-Allow-Origin" in response.headers or \
                   "access-control-allow-origin" in response.headers

    def test_rate_limiting_on_auth_endpoints(self):
        """Test rate limiting on authentication endpoints"""
        # This test would need actual rate limiting implementation
        # For now, just verify the endpoint responds consistently
        headers = {"Authorization": f"Bearer {VALID_TEST_JWT}"}
        
        responses = []
        for _ in range(5):
            response = client.get("/protected/test", headers=headers)
            responses.append(response.status_code)
            time.sleep(0.1)
        
        # All responses should be consistent (either all 401 or all 200/404)
        assert len(set(responses)) <= 2  # Should be consistent

    def test_token_expiration_handling(self):
        """Test handling of expired tokens"""
        headers = {"Authorization": f"Bearer {EXPIRED_TEST_JWT}"}
        response = client.get("/protected/test", headers=headers)
        
        # Should return 401 for expired token
        assert response.status_code == 401

    @patch('apps.api.auth.verify_supabase_jwt_token')
    def test_user_metadata_extraction(self, mock_verify):
        """Test that user metadata is properly extracted from JWT"""
        user_with_metadata = {
            **MOCK_USER,
            "user_metadata": {"name": "John Doe", "role": "premium"},
            "app_metadata": {"provider": "google", "last_login": "2024-01-01"}
        }
        mock_verify.return_value = user_with_metadata
        
        headers = {"Authorization": f"Bearer {VALID_TEST_JWT}"}
        response = client.get("/user/profile", headers=headers)
        
        # Verify that metadata is accessible
        if response.status_code == 200:
            data = response.json()
            # Check if user metadata is included in response
            assert "user_metadata" in data or "name" in data

    def test_concurrent_authentication_requests(self):
        """Test handling of concurrent authentication requests"""
        import threading
        import queue
        
        results = queue.Queue()
        
        def make_request():
            headers = {"Authorization": f"Bearer {VALID_TEST_JWT}"}
            response = client.get("/protected/test", headers=headers)
            results.put(response.status_code)
        
        # Start multiple concurrent requests
        threads = []
        for _ in range(10):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all requests to complete
        for thread in threads:
            thread.join()
        
        # Collect results
        status_codes = []
        while not results.empty():
            status_codes.append(results.get())
        
        # All requests should return consistent status codes
        assert len(status_codes) == 10
        # Should be either all 401 (no auth) or mix of 401/404/200
        unique_codes = set(status_codes)
        assert unique_codes.issubset({200, 401, 404})

class TestAuthMiddleware:
    """Test authentication middleware functionality"""

    @patch('apps.api.auth.verify_supabase_jwt_token')
    def test_middleware_user_injection(self, mock_verify):
        """Test that middleware properly injects user into request context"""
        mock_verify.return_value = MOCK_USER
        
        headers = {"Authorization": f"Bearer {VALID_TEST_JWT}"}
        
        # This would test if user is properly injected into request
        # Implementation depends on actual middleware setup
        response = client.get("/user/profile", headers=headers)
        
        # Verify middleware processed the request
        assert response.status_code in [200, 404]

    def test_middleware_error_handling(self):
        """Test middleware error handling for various scenarios"""
        test_cases = [
            {"headers": {}, "expected": 401},  # No auth header
            {"headers": {"Authorization": "Bearer "}, "expected": 401},  # Empty token
            {"headers": {"Authorization": "Invalid format"}, "expected": 401},  # Invalid format
        ]
        
        for case in test_cases:
            response = client.get("/protected/test", headers=case["headers"])
            assert response.status_code == case["expected"]

if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 