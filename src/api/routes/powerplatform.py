# FastAPI route for Power Platform integration (health check and stub)

from fastapi import APIRouter, HTTPException
from integrations.powerplatform_client import get_access_token, list_power_apps, list_power_automate_flows, scan_solution, store_scan_result
import logging

router = APIRouter()

from pydantic import BaseModel

logger = logging.getLogger("powerplatform.api")

class ScanRequest(BaseModel):
    solution_path: str

@router.get("/powerplatform/health")
def powerplatform_health():
    """Health check for Power Platform integration.
    Returns:
        200: {"status": "ok", "token_preview": str}
        500: {"error": str, "code": str}
    """
    try:
        token = get_access_token()
        return {"status": "ok", "token_preview": token[:10] + "..."}
    except Exception as e:
        logger.exception("/powerplatform/health error")
        raise HTTPException(status_code=500, detail={"error": "Power Platform health check failed.", "code": "HEALTH_CHECK_FAILED"})

@router.get("/powerplatform/apps")
def get_power_apps():
    """List Power Apps (mock data if environment not available).
    Returns:
        200: {"apps": list}
        500: {"error": str, "code": str}
    """
    try:
        return {"apps": list_power_apps()}
    except Exception as e:
        logger.exception("/powerplatform/apps error")
        raise HTTPException(status_code=500, detail={"error": "Failed to list Power Apps.", "code": "LIST_APPS_FAILED"})

@router.get("/powerplatform/flows")
def get_power_automate_flows():
    """List Power Automate Flows (mock data if environment not available).
    Returns:
        200: {"flows": list}
        500: {"error": str, "code": str}
    """
    try:
        return {"flows": list_power_automate_flows()}
    except Exception as e:
        logger.exception("/powerplatform/flows error")
        raise HTTPException(status_code=500, detail={"error": "Failed to list Power Automate Flows.", "code": "LIST_FLOWS_FAILED"})

@router.post("/powerplatform/scan")
def scan_powerplatform_solution(request: ScanRequest):
    """Scan a Power Platform solution (mock static analysis) and store the result.
    Returns:
        200: Scan result record
        500: {"error": str, "code": str}
    """
    try:
        result = scan_solution(request.solution_path)
        # TODO: Replace with real user ID from auth context
        mock_user_id = "00000000-0000-0000-0000-000000000000"
        stored = store_scan_result(
            solution_name=request.solution_path.split("/")[-1],
            solution_path=request.solution_path,
            findings=result["findings"],
            summary=result["summary"],
            initiated_by=mock_user_id,
            status="completed",
            raw_response=result
        )
        return stored
    except Exception as e:
        logger.exception("/powerplatform/scan error")
        raise HTTPException(status_code=500, detail={"error": "Failed to scan and store result.", "code": "SCAN_FAILED"}) 