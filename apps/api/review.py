from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from typing import List, Optional
from pydantic import BaseModel, Field
from . import supabase_client, auth
from uuid import UUID
from datetime import datetime

router = APIRouter(prefix="/review", tags=["review"])

# --- Pydantic Models ---
class ReviewActionRequest(BaseModel):
    reviewer_id: UUID
    feedback: Optional[str] = None
    override_recommendation: Optional[str] = None

class ReviewFeedbackRequest(BaseModel):
    user_id: UUID
    feedback_type: str = Field(..., pattern="^(correct|incorrect|override|comment)$")
    comments: Optional[str] = None
    override_recommendation: Optional[str] = None

class ReviewResult(BaseModel):
    id: UUID
    scan_id: UUID
    user_id: UUID
    finding: str
    severity: Optional[str]
    compliance_framework: Optional[str]
    details: Optional[dict]
    review_status: Optional[str]
    reviewer_id: Optional[UUID]
    reviewer_feedback: Optional[str]
    override_recommendation: Optional[str]
    created_at: datetime

# --- Endpoints ---
@router.get("/queue", response_model=List[ReviewResult])
def get_review_queue(org_id: str = Query(...), current_user=Depends(auth.require_org_role("org_id", "reviewer"))):
    """List all results pending review."""
    results = supabase_client.get_review_queue(org_id)
    if "error" in results:
        raise HTTPException(status_code=400, detail=results["error"])
    return results.get("data", [])

@router.post("/{result_id}/approve")
def approve_result(result_id: UUID = Path(...), req: ReviewActionRequest = None, org_id: str = Query(...), current_user=Depends(auth.require_org_role("org_id", "reviewer"))):
    """Approve a result."""
    resp = supabase_client.update_result_review_status(result_id, org_id, "approved", req.reviewer_id, req.feedback)
    if "error" in resp:
        raise HTTPException(status_code=400, detail=resp["error"])
    supabase_client.create_audit_log(org_id, current_user["id"], "review_approved", str(result_id), "results", {"feedback": req.feedback})
    return {"status": "approved"}

@router.post("/{result_id}/override")
def override_result(result_id: UUID = Path(...), req: ReviewActionRequest = None, org_id: str = Query(...), current_user=Depends(auth.require_org_role("org_id", "reviewer"))):
    """Override a result's recommendation."""
    resp = supabase_client.update_result_review_status(result_id, org_id, "overridden", req.reviewer_id, req.feedback, req.override_recommendation)
    if "error" in resp:
        raise HTTPException(status_code=400, detail=resp["error"])
    supabase_client.create_audit_log(org_id, current_user["id"], "review_overridden", str(result_id), "results", {"feedback": req.feedback, "override_recommendation": req.override_recommendation})
    return {"status": "overridden"}

@router.post("/{result_id}/reject")
def reject_result(result_id: UUID = Path(...), req: ReviewActionRequest = None, org_id: str = Query(...), current_user=Depends(auth.require_org_role("org_id", "reviewer"))):
    """Reject a result."""
    resp = supabase_client.update_result_review_status(result_id, org_id, "rejected", req.reviewer_id, req.feedback)
    if "error" in resp:
        raise HTTPException(status_code=400, detail=resp["error"])
    supabase_client.create_audit_log(org_id, current_user["id"], "review_rejected", str(result_id), "results", {"feedback": req.feedback})
    return {"status": "rejected"}

@router.post("/{result_id}/feedback")
def submit_review_feedback(result_id: UUID = Path(...), req: ReviewFeedbackRequest = None, org_id: str = Query(...), current_user=Depends(auth.get_current_user)):
    """Submit feedback for a result (any user)."""
    resp = supabase_client.create_review_feedback(result_id, req.user_id, req.feedback_type, req.comments, req.override_recommendation)
    if "error" in resp:
        raise HTTPException(status_code=400, detail=resp["error"])
    supabase_client.create_audit_log(org_id, current_user["id"], "review_feedback", str(result_id), "results", {"feedback_type": req.feedback_type, "comments": req.comments, "override_recommendation": req.override_recommendation})
    return {"status": "feedback_submitted"}

@router.get("/{result_id}/audit")
def get_review_audit(result_id: UUID = Path(...), org_id: str = Query(...), current_user=Depends(auth.require_org_role("org_id", "reviewer"))):
    """Get audit trail for a result."""
    logs = supabase_client.get_review_audit_logs(result_id)
    if "error" in logs:
        raise HTTPException(status_code=400, detail=logs["error"])
    return logs.get("data", []) 