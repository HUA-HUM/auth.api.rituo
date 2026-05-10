import { ttlToMilliseconds } from './ttlToMilliseconds';

describe('ttlToMilliseconds', () => {
  it('converts supported ttl values', () => {
    expect(ttlToMilliseconds('15m')).toBe(900_000);
    expect(ttlToMilliseconds('30d')).toBe(2_592_000_000);
  });
});
