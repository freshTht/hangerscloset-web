import { describe, it, expect } from 'vitest';
import { MockAccessControlService } from '../mockAccessControlService';

describe('MockAccessControlService', () => {
  it('allows default staff and admin emails', async () => {
    const service = new MockAccessControlService(['staff@hangerscloset.com', 'admin@hangerscloset.com']);
    expect(await service.checkIsAuthorized('staff@hangerscloset.com')).toBe(true);
    expect(await service.checkIsAuthorized('ADMIN@hangerscloset.com')).toBe(true);
  });

  it('denies access to unknown emails', async () => {
    const service = new MockAccessControlService(['staff@hangerscloset.com']);
    expect(await service.checkIsAuthorized('stranger@gmail.com')).toBe(false);
    expect(await service.checkIsAuthorized(null)).toBe(false);
  });

  it('allows dynamically updating allowlist', async () => {
    const service = new MockAccessControlService();
    service.setAllowedEmails(['newuser@hangerscloset.com']);

    expect(await service.checkIsAuthorized('newuser@hangerscloset.com')).toBe(true);
    expect(await service.checkIsAuthorized('staff@hangerscloset.com')).toBe(false);
  });
});
