import { useMutation } from '@tanstack/react-query';

export interface AdminResetPasswordRequest {
  user_email: string;
}

export interface AdminResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface APIError {
  success?: false;
  error?: {
    type?: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

async function postAdminResetPassword(
  req: AdminResetPasswordRequest
): Promise<AdminResetPasswordResponse | APIError> {
  const res = await fetch('/api/admin/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    credentials: 'include',
  });
  return res.json();
}

export function useAdminResetPassword() {
  return useMutation<
    AdminResetPasswordResponse | APIError,
    Error,
    AdminResetPasswordRequest
  >({
    mutationFn: postAdminResetPassword,
  });
}
