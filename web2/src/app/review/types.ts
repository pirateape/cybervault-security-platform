export interface ReviewResult {
  id: string
  scan_id: string
  user_id: string
  finding: string
  severity?: string
  compliance_framework?: string
  details?: Record<string, any>
  review_status?: string
  reviewer_id?: string
  reviewer_feedback?: string
  override_recommendation?: string
  created_at: string
}

export interface ReviewFilters {
  status: string
  severity: string
  framework: string
  searchTerm: string
}

export interface ReviewActionRequest {
  reviewer_id: string
  feedback?: string
  override_recommendation?: string
}

export interface ReviewFeedbackRequest {
  user_id: string
  feedback_type: 'correct' | 'incorrect' | 'override' | 'comment'
  comments?: string
  override_recommendation?: string
}

export interface ReviewStats {
  total: number
  pending: number
  approved: number
  rejected: number
  overridden: number
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  user_id: string
  action: string
  resource_id: string
  resource_type: string
  details: Record<string, any>
} 