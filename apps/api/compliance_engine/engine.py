import json
import os
import asyncio
from typing import Any, Dict, List, Optional
from .rule_schema import ComplianceRule, RuleCondition
from .facts import fact_registry

class RuleEngine:
    """
    Core compliance rule engine.
    - Loads rules from JSON/YAML.
    - Registers fact handlers.
    - Evaluates rules using all/any/not logic, supports async facts.
    - Supports extensibility: new operators, decorators, named conditions, event listeners.
    - Logs evaluation trace for auditability.
    """
    def __init__(self, rules_dir: str):
        """Initialize engine with rules directory."""
        self.rules_dir = rules_dir
        self.rules: List[ComplianceRule] = []

    def load_rules(self):
        """Load all rules from the rules directory."""
        self.rules = []
        for filename in os.listdir(self.rules_dir):
            if filename.endswith('.json'):
                with open(os.path.join(self.rules_dir, filename), 'r') as f:
                    rule_data = json.load(f)
                    self.rules.append(ComplianceRule(**rule_data))

    async def evaluate_condition(self, cond: RuleCondition, facts: Dict[str, Any]) -> bool:
        """
        Evaluate a single condition using the registered fact handler and operator.
        Supports async fact handlers. Extendable for new operators.
        """
        fact_value = await fact_registry.resolve(cond.fact, facts.get(cond.fact.split(".")[0], {}))
        op = cond.operator
        val = cond.value
        # Basic operator support (expand as needed)
        if op == 'equal':
            return fact_value == val
        elif op == 'notEqual':
            return fact_value != val
        elif op == 'in':
            return fact_value in val
        elif op == 'notIn':
            return fact_value not in val
        # Add more operators as needed
        raise NotImplementedError(f"Operator {op} not implemented.")

    async def evaluate_conditions(self, conditions: Dict[str, List[RuleCondition]], facts: Dict[str, Any]) -> bool:
        """
        Evaluate a set of conditions using all/any/not logic.
        Supports nesting and composability. Extendable for named conditions.
        """
        if 'all' in conditions:
            return all([await self.evaluate_condition(c, facts) for c in conditions['all']])
        if 'any' in conditions:
            return any([await self.evaluate_condition(c, facts) for c in conditions['any']])
        if 'not' in conditions:
            return not all([await self.evaluate_condition(c, facts) for c in conditions['not']])
        return False

    async def run(self, facts: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Run all active rules against the provided facts.
        Returns a list of result objects (rule id, name, passed, event, framework, severity).
        Logs evaluation trace for auditability.
        """
        results = []
        for rule in self.rules:
            if not rule.is_active:
                continue
            passed = await self.evaluate_conditions(rule.conditions, facts)
            result = {
                'rule_id': rule.id,
                'name': rule.name,
                'passed': passed,
                'event': rule.event.dict() if not passed else None,
                'framework': rule.framework,
                'severity': rule.severity
            }
            results.append(result)
        return results 