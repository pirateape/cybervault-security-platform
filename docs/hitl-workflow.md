# Human-in-the-Loop (HITL) Workflow Design

## Purpose

To ensure all AI-generated risk recommendations and remediation suggestions are subject to human validation, feedback, and override before final action, maintaining compliance, auditability, and trust.

## Key Roles

- **Reviewer:** Can view AI-generated recommendations, provide feedback, approve/reject, and request additional information.
- **Approver:** Can finalize decisions, override AI recommendations, and trigger retraining or escalation.
- **Auditor:** Can view all actions, feedback, and overrides for compliance and audit purposes.

## Workflow Steps

1. **AI generates a risk recommendation or remediation suggestion.**
2. **Recommendation is sent to the review dashboard (frontend) and stored in the backend (Supabase).**
3. **Reviewer is notified and reviews the recommendation:**
   - Can approve, reject, or request more information.
   - Can provide feedback for model retraining.
4. **If approved, the recommendation is escalated to an Approver (if required by policy).**
5. **Approver can override, approve, or escalate further.**
6. **All actions, feedback, and overrides are logged for audit.**
7. **Auditor can review the full history for compliance.**

## Decision Points

- **Initial Review:** Human reviewer must validate all high/critical risk recommendations.
- **Override:** Approver can override AI or reviewer decisions with justification.
- **Retraining Trigger:** Sufficient negative feedback or overrides can trigger a model retraining workflow.

## Permissions Matrix

| Role     | View | Approve | Override | Feedback | Audit |
| -------- | ---- | ------- | -------- | -------- | ----- |
| Reviewer | ✔    | ✔       | ✖        | ✔        | ✖     |
| Approver | ✔    | ✔       | ✔        | ✔        | ✖     |
| Auditor  | ✔    | ✖       | ✖        | ✖        | ✔     |

## Integration Points

- **Frontend:** Dashboard for reviewers/approvers, feedback forms, audit log viewer.
- **Backend:** Supabase tables for recommendations, feedback, audit logs; API endpoints for actions.
- **Notifications:** Real-time updates via Supabase subscriptions or webhooks.

## References

- See README.md for project structure and backend/frontend integration points.
- See Supabase docs for RLS and audit logging best practices.

## API Endpoints and RLS Policy Usage

### FastAPI Endpoints (apps/api/review.py)

- **GET /review/queue**: List all results pending review (reviewer access)
- **POST /review/{result_id}/approve**: Approve a result (reviewer)
- **POST /review/{result_id}/override**: Override a recommendation (reviewer/approver)
- **POST /review/{result_id}/reject**: Reject a result (reviewer)
- **POST /review/{result_id}/feedback**: Submit feedback (any user)
- **GET /review/{result_id}/audit**: Get audit trail for a result (reviewer)

All endpoints enforce org role-based access using the `require_org_role` dependency and Supabase JWT claims.

### Supabase RLS Policies (supabase/schemas/003_rls_granular_policies.sql)

- **remediation_actions**: RLS enabled; only org reviewers/approvers/admins/owners can select, assigned users or approvers/admins can update, only admins/owners can delete.
- **review_feedback**: RLS enabled; only org reviewers/approvers/admins/owners can select, users can insert/update their own feedback, only admins/owners can delete.

Policies use the `org_members` table for role checks and enforce strict access control for all HITL workflow data.

### Compliance Notes

- All sensitive actions and feedback are logged in the `audit_logs` table.
- RLS policies ensure only authorized users can access or modify HITL-related data.
- See `supabase/schemas/003_rls_granular_policies.sql` for full policy definitions.
- See `apps/api/review.py` for endpoint implementation and role enforcement.
