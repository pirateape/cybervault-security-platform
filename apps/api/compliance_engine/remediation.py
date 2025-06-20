from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from apps.api import supabase_client
from uuid import UUID
from datetime import datetime
import requests
import os

class RemediationAction(BaseModel):
    id: Optional[UUID] = None
    result_id: UUID
    status: str = Field(default='open', pattern='^(open|in_progress|resolved|closed)$')
    assigned_to: Optional[UUID] = None
    verified: bool = False
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

# CRUD functions for Supabase integration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
headers = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

async def create_remediation_action(action: RemediationAction) -> RemediationAction:
    url = f"{SUPABASE_URL}/rest/v1/remediation_actions"
    payload = [action.model_dump(exclude_unset=True)]
    resp = requests.post(url, headers=headers, json=payload)
    data = resp.json()
    return RemediationAction(**data[0])

async def get_remediation_action(action_id: UUID) -> Optional[RemediationAction]:
    url = f"{SUPABASE_URL}/rest/v1/remediation_actions?id=eq.{action_id}"
    resp = requests.get(url, headers=headers)
    data = resp.json()
    if data:
        return RemediationAction(**data[0])
    return None

async def update_remediation_action(action_id: UUID, updates: Dict[str, Any]) -> Optional[RemediationAction]:
    url = f"{SUPABASE_URL}/rest/v1/remediation_actions?id=eq.{action_id}"
    payload = updates
    resp = requests.patch(url, headers=headers, json=payload)
    data = resp.json()
    if data:
        return RemediationAction(**data[0])
    return None

async def list_remediation_actions(result_id: Optional[UUID] = None, assigned_to: Optional[UUID] = None, status: Optional[str] = None):
    url = f"{SUPABASE_URL}/rest/v1/remediation_actions?"
    if result_id:
        url += f"result_id=eq.{result_id}&"
    if assigned_to:
        url += f"assigned_to=eq.{assigned_to}&"
    if status:
        url += f"status=eq.{status}&"
    url = url.rstrip('&?')
    resp = requests.get(url, headers=headers)
    data = resp.json()
    return [RemediationAction(**item) for item in data]

# Placeholder for future Supabase integration
# def store_remediation_action(...):
#     pass 

VALID_STATUS_TRANSITIONS = {
    'open': {'in_progress', 'resolved', 'closed'},
    'in_progress': {'resolved', 'closed'},
    'resolved': {'closed'},
    'closed': set(),
}

def is_valid_status_transition(current: str, new: str) -> bool:
    return new in VALID_STATUS_TRANSITIONS.get(current, set())

async def update_remediation_status(action_id: UUID, new_status: str) -> Optional[RemediationAction]:
    action = await get_remediation_action(action_id)
    if not action:
        return None
    if not is_valid_status_transition(action.status, new_status):
        raise ValueError(f"Invalid status transition from {action.status} to {new_status}")
    return await update_remediation_action(action_id, {"status": new_status, "updated_at": datetime.utcnow()})

async def assign_remediation_action(action_id: UUID, user_id: UUID) -> Optional[RemediationAction]:
    return await update_remediation_action(action_id, {"assigned_to": str(user_id), "updated_at": datetime.utcnow()})

async def verify_remediation_action(action_id: UUID, verified: bool = True) -> Optional[RemediationAction]:
    return await update_remediation_action(action_id, {"verified": verified, "updated_at": datetime.utcnow()}) 