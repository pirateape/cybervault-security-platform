# AI Risk Analysis Microservice

## Overview

This microservice provides AI-driven risk prediction and remediation suggestions for compliance scan results. It exposes a REST API for integration with the main compliance engine backend.

## API

- **POST /predict**
  - Input: Scan result JSON (org_id, scan_id, user_id, finding, severity, compliance_framework, details)
  - Output: Risk score (0-1), recommendation, model version

### Example Request

```json
POST /predict
{
  "org_id": "123e4567-e89b-12d3-a456-426614174000",
  "scan_id": "abc123",
  "user_id": "user42",
  "finding": "non-compliant",
  "severity": "high",
  "compliance_framework": "NIST",
  "details": {"control": "MFA"}
}
```

### Example Response

```json
{
  "risk_score": 0.7,
  "recommendation": "Immediate remediation required.",
  "model_version": "v0.1-dummy"
}
```

## Running Locally

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

## Model Integration

- Replace the dummy logic in `main.py` with real TensorFlow or scikit-learn model inference.
- Place model files in the `model/` directory.
