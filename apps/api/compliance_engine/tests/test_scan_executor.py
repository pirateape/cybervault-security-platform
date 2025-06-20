import pytest
from apps.api.compliance_engine.scan_executor import ScanExecutor
import tempfile
import json
import asyncio

@pytest.fixture
def rules_dir(tmp_path):
    rule = {
        "id": "scan-rule-1",
        "name": "Scan Rule",
        "description": "A scan rule.",
        "framework": "TEST",
        "severity": "low",
        "conditions": {"all": [{"fact": "user.mfa_enabled", "operator": "equal", "value": True}]},
        "event": {"type": "non_compliance", "params": {"message": "MFA not enabled."}},
        "is_active": True
    }
    rules_path = tmp_path / "rules"
    rules_path.mkdir()
    with open(rules_path / "scan_rule.json", "w") as f:
        json.dump(rule, f)
    return str(rules_path)

@pytest.mark.asyncio
async def test_execute_scan_pass(rules_dir):
    executor = ScanExecutor(rules_dir)
    facts = {"user": {"mfa_enabled": True}}
    results = await executor.execute_scan(facts)
    assert results[0]["passed"] is True

@pytest.mark.asyncio
async def test_execute_scan_fail(rules_dir):
    executor = ScanExecutor(rules_dir)
    facts = {"user": {"mfa_enabled": False}}
    results = await executor.execute_scan(facts)
    assert results[0]["passed"] is False
    assert results[0]["event"]["type"] == "non_compliance" 