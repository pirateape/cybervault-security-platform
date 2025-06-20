# Compliance Rule Engine Architecture

## Overview

The compliance rule engine is a modular, extensible system for evaluating security and compliance rules (NIST, ISO 27001, CIS, etc.) against ingested data, storing results, and supporting remediation workflows. The architecture is designed for maintainability, scalability, and easy integration with new frameworks and data sources.

---

## Core Components

### 1. Rule Repository

- **Purpose:** Store, retrieve, and version compliance rules (JSON/YAML files or Supabase table).
- **Responsibilities:**
  - Central location for all rule definitions
  - Support for import/export, versioning, enable/disable
  - Schema: id, name, description, framework, severity, conditions, event, parameters, is_active, version, timestamps
- **Extensibility:**
  - Add new rules by authoring JSON/YAML files
  - Support for dynamic rule updates via DB integration

### 2. Fact Registry

- **Purpose:** Central registry for all data points ("facts") used in rule evaluation
- **Responsibilities:**
  - Register and retrieve fact handler functions (sync/async)
  - Support for dynamic, parameterized, and nested facts
- **Extensibility:**
  - Add new facts by registering handler functions
  - Support for async data sources (APIs, DBs)

### 3. Rule Engine

- **Purpose:** Core logic for loading, evaluating, and managing rules
- **Responsibilities:**
  - Load rules from repository
  - Evaluate rules using all/any/not logic
  - Support for async fact resolution
  - Trigger events and log evaluation traces
- **Extensibility:**
  - Add new operators, decorators, event listeners
  - Support for named conditions and rule chaining

### 4. Scan Executor

- **Purpose:** Orchestrate scan execution and result aggregation
- **Responsibilities:**
  - Initialize engine and load rules
  - Execute scans with provided facts
  - Aggregate and return results
- **Extensibility:**
  - Add support for new scan types, aggregation, and orchestration strategies

### 5. Result Storage

- **Purpose:** Store scan results in Supabase (or other DB)
- **Responsibilities:**
  - Store results with metadata, timestamps, and rule references
  - Support for batch storage, error handling, and retries
- **Extensibility:**
  - Integrate with other storage backends
  - Add analytics and reporting

### 6. Remediation Interface

- **Purpose:** Link scan results to remediation actions
- **Responsibilities:**
  - Track remediation status, assignment, and verification
  - Integrate with Supabase (remediation_actions table)
  - Auto-create remediation actions for failed scan results (non-compliance)
  - Expose API endpoints for CRUD, status transitions, assignment, and verification
  - Enforce valid status transitions (e.g., cannot move from closed to in_progress)
- **Extensibility:**
  - Add workflows for status updates, assignment, and verification
  - Integrate with external ticketing systems if needed

#### Remediation API Endpoints

- `POST /api/remediation/` — Create remediation action
- `GET /api/remediation/{id}` — Retrieve remediation action
- `PATCH /api/remediation/{id}` — Update remediation action
- `GET /api/remediation/` — List remediation actions (filterable)
- `POST /api/remediation/{id}/status` — Change status (enforced transitions)
- `POST /api/remediation/{id}/assign` — Assign to user
- `POST /api/remediation/{id}/verify` — Mark as verified/unverified

#### Workflow

- When a scan result is stored with `passed == False`, a remediation action is auto-created and linked to the result.
- Status transitions are enforced by the backend logic.
- Assignment and verification are managed via the API.

---

## Interfaces & Extensibility

- All modules are documented with clear interfaces and docstrings
- New rules, facts, operators, and event listeners can be added without modifying core logic
- Support for async operations and dynamic data sources
- Rule schema is extensible for new frameworks and custom requirements

---

## Rule Storage, Retrieval, and Versioning

- Rules are stored as JSON/YAML files in the `rules/` directory (or Supabase table for dynamic updates)
- Each rule includes version and timestamps for auditability
- Support for import/export and dynamic enable/disable
- Versioning strategy: increment version on rule changes, maintain changelog

---

## Trigger, Processing, and Execution Flows

- **Trigger:** Scans can be initiated by API endpoints, scheduled jobs, or external events
- **Processing:**
  - ScanExecutor loads rules and facts
  - RuleEngine evaluates rules against provided facts
  - Events are triggered for non-compliance or other outcomes
- **Execution:**
  - Results are stored in Supabase
  - Remediation actions are linked and tracked

---

## Best Practices for Maintainability & Scalability

- Modular design: each component is independently testable and replaceable
- Clear interfaces and documentation for all modules
- Parameterized and reusable rules and facts
- Support for async and distributed execution
- Versioned rule management and audit logging
- Easy integration with new frameworks, data sources, and storage backends

---

## Diagram (High-Level)

```
+-------------------+
|   Rule Repository |
+-------------------+
          |
          v
+-------------------+      +-------------------+
|   Fact Registry   |<---->|   Data Sources    |
+-------------------+      +-------------------+
          |
          v
+-------------------+
|    Rule Engine    |
+-------------------+
          |
          v
+-------------------+
|   Scan Executor   |
+-------------------+
          |
          v
+-------------------+
|  Result Storage   |
+-------------------+
          |
          v
+-------------------+
| Remediation/Alert |
+-------------------+
```

---

For further details, see module-level docstrings and the README in this package.
