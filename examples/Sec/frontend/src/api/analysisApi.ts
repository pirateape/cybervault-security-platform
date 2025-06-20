import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';

export interface CodeAnalysisRequest {
  code: string;
  language: string;
  org_id: string;
  user_id: string;
  metadata?: Record<string, unknown>;
}

export interface Diagnostic {
  message: string;
  severity: 'error' | 'warning' | 'info';
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  code?: string;
}

export interface CodeAnalysisResponse {
  diagnostics: Diagnostic[];
  summary: string;
  success: boolean;
}

export interface AIFeedbackRequest {
  code: string;
  language: string;
  org_id: string;
  user_id: string;
  metadata?: Record<string, unknown>;
}

export interface Feedback {
  suggestion: string;
  explanation: string;
  confidence: number;
  line: number;
  column: number;
}

export interface AIFeedbackResponse {
  feedback: Feedback[];
  summary: string;
  success: boolean;
}

export interface APIError {
  success: false;
  error: {
    type: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

async function postCodeAnalysis(
  req: CodeAnalysisRequest
): Promise<CodeAnalysisResponse | APIError> {
  const res = await fetch('/api/code-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    credentials: 'include',
  });
  return res.json();
}

async function postAIFeedback(
  req: AIFeedbackRequest
): Promise<AIFeedbackResponse | APIError> {
  const res = await fetch('/api/ai-feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    credentials: 'include',
  });
  return res.json();
}

export function useCodeAnalysis() {
  return useMutation<
    CodeAnalysisResponse | APIError,
    Error,
    CodeAnalysisRequest
  >({
    mutationFn: postCodeAnalysis,
  });
}

export function useAIFeedback() {
  return useMutation<AIFeedbackResponse | APIError, Error, AIFeedbackRequest>({
    mutationFn: postAIFeedback,
  });
}
