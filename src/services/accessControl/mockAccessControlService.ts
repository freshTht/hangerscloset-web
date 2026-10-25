import type { IAccessControlService } from './types';

export class MockAccessControlService implements IAccessControlService {
  private allowedEmails: Set<string>;

  constructor(initialAllowed: string[] = ['staff@hangerscloset.com', 'admin@hangerscloset.com']) {
    const envEmails = (import.meta.env.VITE_ALLOWED_EMAILS || '')
      .split(',')
      .map((e: string) => e.trim().toLowerCase())
      .filter(Boolean);

    this.allowedEmails = new Set([...initialAllowed.map((e) => e.toLowerCase()), ...envEmails]);
  }

  setAllowedEmails(emails: string[]): void {
    this.allowedEmails = new Set(emails.map((e) => e.toLowerCase()));
  }

  async checkIsAuthorized(email: string | null): Promise<boolean> {
    if (!email) return false;
    // Simulate brief network latency
    await new Promise((resolve) => setTimeout(resolve, 100));
    return this.allowedEmails.has(email.toLowerCase());
  }
}

export const mockAccessControlService = new MockAccessControlService();
