import pytest
import asyncio
from apps.api.compliance_engine.engine import RuleEngine
from apps.api.compliance_engine.rule_schema import ComplianceRule, RuleCondition, RuleEvent
import os
import tempfile
import json
from unittest.mock import AsyncMock

@pytest.fixture
def rules_dir(tmp_path):
    # Create a temporary rules directory with a sample rule
    rule = {
        "id": "test-rule-1",
        "name": "Test Rule",
        "description": "A test rule.",
        "framework": "TEST",
        "severity": "low",
        "conditions": {"all": [{"fact": "user.mfa_enabled", "operator": "equal", "value": True}]},
        "event": {"type": "non_compliance", "params": {"message": "MFA not enabled."}},
        "is_active": True
    }
    rules_path = tmp_path / "rules"
    rules_path.mkdir()
    with open(rules_path / "test_rule.json", "w") as f:
        json.dump(rule, f)
    return str(rules_path)

@pytest.mark.asyncio
async def test_rule_engine_load_and_run(rules_dir):
    engine = RuleEngine(rules_dir)
    engine.load_rules()
    assert len(engine.rules) == 1
    # Test passing facts
    facts = {"user": {"mfa_enabled": True}}
    results = await engine.run(facts)
    assert results[0]["passed"] is True
    # Test failing facts
    facts = {"user": {"mfa_enabled": False}}
    results = await engine.run(facts)
    assert results[0]["passed"] is False
    assert results[0]["event"]["type"] == "non_compliance"

@pytest.mark.asyncio
@pytest.mark.parametrize("conditions,facts,expected", [
    ( {"all": [RuleCondition(fact="user.mfa_enabled", operator="equal", value=True)]}, {"user": {"mfa_enabled": True}}, True ),
    ( {"all": [RuleCondition(fact="user.mfa_enabled", operator="equal", value=True)]}, {"user": {"mfa_enabled": False}}, False ),
    ( {"any": [RuleCondition(fact="user.mfa_enabled", operator="equal", value=True), RuleCondition(fact="user.is_admin", operator="equal", value=True)]}, {"user": {"mfa_enabled": False, "is_admin": True}}, True ),
    ( {"not": [RuleCondition(fact="user.mfa_enabled", operator="equal", value=False)]}, {"user": {"mfa_enabled": True}}, True ),
])
async def test_evaluate_conditions(conditions, facts, expected, rules_dir):
    engine = RuleEngine(rules_dir)
    engine.load_rules()
    # Patch engine.rules to use our test conditions
    rule = engine.rules[0]
    rule.conditions = conditions
    # Register dummy fact handler for user.is_admin if needed
    from apps.api.compliance_engine.facts import fact_registry
    if any(
        hasattr(c, 'fact') and c.fact == 'user.is_admin'
        for conds in conditions.values() for c in conds
    ):
        fact_registry.register('user.is_admin', lambda user: user.get('is_admin', False))
    result = await engine.evaluate_conditions(conditions, facts)
    assert result is expected

@pytest.mark.asyncio
async def test_operator_not_implemented(rules_dir):
    engine = RuleEngine(rules_dir)
    engine.load_rules()
    cond = RuleCondition(fact="user.mfa_enabled", operator="unknown", value=True)
    with pytest.raises(NotImplementedError):
        await engine.evaluate_condition(cond, {"user": {"mfa_enabled": True}})

@pytest.mark.asyncio
def test_evaluate_condition_not_implemented():
    from apps.api.compliance_engine.engine import RuleEngine
    from apps.api.compliance_engine.rule_schema import RuleCondition
    engine = RuleEngine(rules_dir="/tmp")
    cond = RuleCondition(fact="user.mfa_enabled", operator="unknown", value=True)
    import pytest
    with pytest.raises(NotImplementedError):
        asyncio.get_event_loop().run_until_complete(engine.evaluate_condition(cond, {"user": {"mfa_enabled": True}}))

@pytest.mark.asyncio
def test_evaluate_conditions_fallback():
    from apps.api.compliance_engine.engine import RuleEngine
    engine = RuleEngine(rules_dir="/tmp")
    # No 'all', 'any', or 'not' in conditions
    result = asyncio.get_event_loop().run_until_complete(engine.evaluate_conditions({}, {}))
    assert result is False

@pytest.mark.asyncio
def test_run_skips_inactive_rules():
    from apps.api.compliance_engine.engine import RuleEngine
    from apps.api.compliance_engine.rule_schema import ComplianceRule, RuleCondition, RuleEvent
    engine = RuleEngine(rules_dir="/tmp")
    rule = ComplianceRule(id="1", name="Inactive", description="", framework="", severity="low", conditions={"all": []}, event=RuleEvent(type="", params={}), is_active=False)
    engine.rules = [rule]
    results = asyncio.get_event_loop().run_until_complete(engine.run({}))
    assert results == []

@pytest.mark.asyncio
def test_run_event_dict_for_failed_rule():
    from apps.api.compliance_engine.engine import RuleEngine
    from apps.api.compliance_engine.rule_schema import ComplianceRule, RuleCondition, RuleEvent
    engine = RuleEngine(rules_dir="/tmp")
    rule = ComplianceRule(id="2", name="Fail", description="", framework="", severity="high", conditions={"all": []}, event=RuleEvent(type="fail", params={}), is_active=True)
    engine.rules = [rule]
    # Patch evaluate_conditions to return False (fail)
    engine.evaluate_conditions = AsyncMock(return_value=False)
    results = asyncio.get_event_loop().run_until_complete(engine.run({}))
    assert results[0]['event'] == rule.event.dict() 