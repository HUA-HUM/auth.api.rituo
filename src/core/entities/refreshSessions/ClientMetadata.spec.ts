import { BadRequestException } from '@nestjs/common';
import { normalizeClientPlatform } from './ClientMetadata';

describe('normalizeClientPlatform', () => {
  it('keeps legacy iOS clients compatible when platform is absent', () => {
    expect(normalizeClientPlatform()).toBe('ios');
  });

  it('accepts Android clients', () => {
    expect(normalizeClientPlatform('android')).toBe('android');
  });

  it('rejects unsupported platforms', () => {
    expect(() => normalizeClientPlatform('windows')).toThrow(
      BadRequestException,
    );
  });
});
