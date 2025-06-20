# Compliance Engine

## Overview

This package implements a modular, extensible compliance scanning engine for applying rules (NIST, ISO 27001, CIS, etc.) to ingested data and storing results in Supabase.

## Architecture

- **rule_schema.py**: Pydantic models for rules and conditions
- **rules/**: JSON/YAML rule definitions
- **facts.py**: Fact handler registry (fetch/compute data for rules)
- **engine.py**: Core rule engine (loads rules, evaluates logic, triggers events)
- **scan_executor.py**: Orchestrates scan execution
- **result_storage.py**: Stores scan results in Supabase
- **remediation.py**: Interfaces for remediation tracking

## Rule Format (JSON Example)

```
{
  "id": "nist-mfa-001",
  "name": "NIST MFA Compliance",
  "description": "Ensure all users have multi-factor authentication enabled.",
  "framework": "NIST",
  "severity": "high",
  "conditions": {
    "all": [
      { "fact": "user.mfa_enabled", "operator": "equal", "value": true }
    ]
  },
  "event": {
    "type": "non_compliance",
    "params": { "message": "User does not have MFA enabled." }
  },
  "is_active": true
}
```

## Adding a New Rule

- Add a JSON or YAML file to `rules/` following the schema in `rule_schema.py`.
- Use facts that have registered handlers in `facts.py`.

## Adding a New Fact Handler

- Implement a function in `facts.py`.
- Register it with `fact_registry.register('fact_name', handler_function)`.

## Usage Example

```
from compliance_engine.scan_executor import ScanExecutor
import asyncio

executor = ScanExecutor(rules_dir='apps/api/compliance_engine/rules')
facts = { 'user': { 'mfa_enabled': False } }
results = asyncio.run(executor.execute_scan(facts))
print(results)
```

## Extending the Engine

- Add new operators or event types in `engine.py`.
- Integrate with new data sources by adding fact handlers.
- Expand result storage or remediation logic as needed.

## Remediation Tracking

The compliance engine supports automated remediation tracking for failed scan results. When a scan result indicates non-compliance (i.e., `passed == False`), a remediation action is automatically created and linked to the result.

### Remediation Action Model

- Linked to a scan result (`result_id`)
- Tracks status (`open`, `in_progress`, `resolved`, `closed`)
- Assignment to a user (`assigned_to`)
- Verification (`verified` boolean)
- Metadata, timestamps

### API Endpoints

- `POST /api/remediation/` — Create a remediation action
- `GET /api/remediation/{id}` — Retrieve a remediation action
- `PATCH /api/remediation/{id}` — Update a remediation action
- `GET /api/remediation/` — List remediation actions (filter by result, user, status)
- `POST /api/remediation/{id}/status` — Change status (enforces valid transitions)
- `POST /api/remediation/{id}/assign` — Assign to a user
- `POST /api/remediation/{id}/verify` — Mark as verified/unverified

### Workflow

- When a scan result is stored with `passed == False`, a remediation action is auto-created.
- Status transitions are enforced (e.g., cannot move from `closed` to `in_progress`).
- Assignment and verification can be managed via the API.

### Example: Auto-Remediation Creation

```python
from apps.api.compliance_engine.result_storage import store_scan_result
import asyncio

asyncio.run(store_scan_result(
    org_id='...',
    scan_id='...',
    user_id='...',
    finding='non-compliant',
    severity='high',
    compliance_framework='NIST',
    details={},
    passed=False  # triggers remediation creation
))
```

### Example: List Remediation Actions

```python
import requests
resp = requests.get('http://localhost:8000/api/remediation/', params={'status': 'open'})
print(resp.json())
```

See also: [ARCHITECTURE.md](ARCHITECTURE.md) for design details.

## Planned: Modular Rules CRUD API

- Implement a FastAPI router (`rules_api.py`) for CRUD operations on compliance rules.
- Use the `ComplianceRule` model for validation and serialization.
- Integrate with Supabase for persistent storage, leveraging RLS and RBAC for security.
- Endpoints: `GET /rules/`, `GET /rules/{id}`, `POST /rules/`, `PUT /rules/{id}`, `DELETE /rules/{id}`.
- Enforce RBAC using the same pattern as audit logs (custom `authorize` function, role/permission tables).
- Add tests for all endpoints and permission scenarios.
