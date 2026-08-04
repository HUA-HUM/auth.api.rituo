import { BadRequestException } from '@nestjs/common';

export type ClientPlatform = 'ios' | 'android';

export function normalizeClientPlatform(
  platform?: string | null,
): ClientPlatform {
  const normalized = platform?.trim().toLowerCase() || 'ios';

  if (normalized !== 'ios' && normalized !== 'android') {
    throw new BadRequestException('platform must be ios or android');
  }

  return normalized;
}

export function normalizeOptionalClientText(
  value?: string | null,
): string | null {
  const normalized = value?.trim();
  return normalized || null;
}
