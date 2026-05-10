const units: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

export function ttlToMilliseconds(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl);

  if (!match) {
    throw new Error(`Invalid ttl value: ${ttl}`);
  }

  return Number(match[1]) * units[match[2]];
}
