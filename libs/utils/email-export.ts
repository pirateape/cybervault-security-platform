// libs/utils/email-export.ts
// Modular email delivery utility for report exports
// Supports pluggable providers (Resend, Supabase SMTP, etc.)

export interface EmailExportOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>;
  metadata?: Record<string, any>;
}

export interface EmailExportProvider {
  sendEmail(options: EmailExportOptions): Promise<{ success: boolean; error?: string }>;
}

// Default provider stub (to be implemented with Resend, Supabase SMTP, etc.)
class DefaultEmailExportProvider implements EmailExportProvider {
  async sendEmail(options: EmailExportOptions): Promise<{ success: boolean; error?: string }> {
    // TODO: Integrate with Resend, Supabase SMTP, or other provider
    // TODO: Handle attachments, HTML/text body, error handling
    return { success: false, error: 'Email provider not implemented' };
  }
}

// Singleton instance (can be swapped for testing or custom providers)
let provider: EmailExportProvider = new DefaultEmailExportProvider();

export function setEmailExportProvider(customProvider: EmailExportProvider) {
  provider = customProvider;
}

export async function sendExportEmail(options: EmailExportOptions) {
  return provider.sendEmail(options);
} 