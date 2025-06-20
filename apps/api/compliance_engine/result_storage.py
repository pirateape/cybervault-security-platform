from apps.api import supabase_client
from typing import Any, Dict, Optional
import datetime
from apps.api.compliance_engine.remediation import create_remediation_action, RemediationAction

async def store_scan_result(org_id: str, scan_id: str, user_id: str, finding: str, severity: str, compliance_framework: str, details: Optional[dict] = None, passed: Optional[bool] = None):
    """
    Store a single scan result in Supabase.
    - org_id: Organization ID
    - scan_id: Scan job ID
    - user_id: User who triggered the scan
    - finding: Finding description
    - severity: Severity level
    - compliance_framework: Compliance framework name
    - details: Optional metadata/details
    - passed: Optional boolean indicating whether the scan passed
    Extensible: Add batch storage, error handling, and retry logic as needed.
    """
    try:
        result = supabase_client.create_result(
            org_id=org_id,
            scan_id=scan_id,
            user_id=user_id,
            finding=finding,
            severity=severity,
            compliance_framework=compliance_framework,
            details=details or {}
        )
        # result['data'] is a list with the created result dict
        if passed is False and result and 'data' in result and result['data']:
            result_id = result['data'][0]['id']
            remediation = RemediationAction(result_id=result_id)
            await create_remediation_action(remediation)
        return result
    except Exception as e:
        # TODO: Add retry logic or error logging as needed
        raise e 