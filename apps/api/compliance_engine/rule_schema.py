from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional, Union
from datetime import datetime

class RuleCondition(BaseModel):
    """
    Represents a single condition in a compliance rule.
    - fact: The name of the fact to evaluate (e.g., 'user.mfa_enabled').
    - operator: The comparison operator (e.g., 'equal', 'in', 'greaterThan').
    - value: The value to compare the fact against.
    - path: Optional JSONPath for nested data.
    - params: Optional parameters for dynamic fact evaluation.
    """
    fact: str
    operator: str
    value: Any
    path: Optional[str] = None
    params: Optional[Dict[str, Any]] = None

class RuleEvent(BaseModel):
    """
    Event triggered when a rule condition passes or fails.
    - type: Event type (e.g., 'non_compliance').
    - params: Additional event parameters (e.g., message, metadata).
    """
    type: str
    params: Optional[Dict[str, Any]] = None

class ComplianceRule(BaseModel):
    """
    Main compliance rule object.
    - id: Unique rule identifier.
    - name: Human-readable rule name.
    - description: Rule description.
    - framework: Compliance framework (e.g., 'NIST', 'ISO27001').
    - severity: Severity level ('low', 'medium', 'high', 'critical').
    - conditions: Dict with 'all', 'any', or 'not' keys and lists of RuleCondition.
    - event: Event to trigger on rule evaluation.
    - parameters: Optional rule parameters for customization.
    - is_active: Whether the rule is enabled.
    - version: Rule version string.
    - created_at: Creation timestamp.
    - updated_at: Last update timestamp.
    """
    id: str
    name: str
    description: str
    framework: str  # e.g., 'NIST', 'ISO27001', 'CIS'
    severity: str  # e.g., 'low', 'medium', 'high', 'critical'
    conditions: Dict[str, List[RuleCondition]]  # 'all', 'any', 'not'
    event: RuleEvent
    parameters: Optional[Dict[str, Any]] = None
    is_active: bool = True
    version: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None 