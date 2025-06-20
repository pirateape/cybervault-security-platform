import pytest
from apps.api.compliance_engine.rule_schema import ComplianceRule, RuleCondition, RuleEvent
from datetime import datetime

def test_rule_condition_validation():
    cond = RuleCondition(fact='user.mfa_enabled', operator='equal', value=True)
    assert cond.fact == 'user.mfa_enabled'
    assert cond.operator == 'equal'
    assert cond.value is True
    assert cond.path is None
    assert cond.params is None

def test_rule_event_validation():
    event = RuleEvent(type='non_compliance', params={'message': 'fail'})
    assert event.type == 'non_compliance'
    assert event.params['message'] == 'fail'

def test_compliance_rule_validation():
    cond = RuleCondition(fact='user.mfa_enabled', operator='equal', value=True)
    event = RuleEvent(type='non_compliance', params={'message': 'fail'})
    rule = ComplianceRule(
        id='rule-1',
        name='Test Rule',
        description='desc',
        framework='NIST',
        severity='high',
        conditions={'all': [cond]},
        event=event,
        is_active=True,
        version='1.0.0',
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    assert rule.id == 'rule-1'
    assert rule.conditions['all'][0].fact == 'user.mfa_enabled'
    assert rule.event.type == 'non_compliance'
    assert rule.is_active is True
    # Test serialization
    data = rule.dict()
    assert data['id'] == 'rule-1' 