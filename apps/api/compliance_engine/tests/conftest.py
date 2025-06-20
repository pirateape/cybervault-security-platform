import pytest
import asyncio
import os
import tempfile
import json

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def sample_facts():
    return {
        "user": {"mfa_enabled": True, "is_admin": False, "last_login_days": 10},
        "system": {"audit_log_enabled": True},
        "tenant": {"encryption_enabled": True},
    }

@pytest.fixture
def temp_rules_dir(tmp_path):
    rules_path = tmp_path / "rules"
    rules_path.mkdir()
    return str(rules_path)

@pytest.fixture(autouse=True)
def mock_supabase(mocker):
    """
    Automatically patch Supabase client and external API calls for all tests.
    """
    mocker.patch('apps.api.supabase_client.create_result', autospec=True)
    # Add more patches as needed for other external dependencies

@pytest.fixture
def example_rule():
    return {
        "id": "test-rule-1",
        "name": "Test Rule",
        "description": "A test rule.",
        "framework": "TEST",
        "severity": "low",
        "conditions": {"all": [{"fact": "user.mfa_enabled", "operator": "equal", "value": True}]},
        "event": {"type": "non_compliance", "params": {"message": "MFA not enabled."}},
        "is_active": True
    }

# Enable pytest-cov plugin for coverage
pytest_plugins = ["pytest_cov"] 