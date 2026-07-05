import { SQLRefreshSessionsRepository } from './SQLRefreshSessionsRepository';

describe('SQLRefreshSessionsRepository', () => {
  it('unwraps PostgreSQL mutation results returned by TypeORM', async () => {
    const row = {
      id: 'session-id',
      userId: 'user-id',
      deviceId: 'device-id',
      deviceLabel: 'iPhone',
      tokenHash: 'token-hash',
      userAgent: 'rituo-ios',
      ipAddress: '127.0.0.1',
      expiresAt: new Date('2026-08-05T10:00:00.000Z'),
      revokedAt: null,
      lastUsedAt: null,
      createdAt: new Date('2026-07-05T10:00:00.000Z'),
      updatedAt: new Date('2026-07-05T10:00:00.000Z'),
    };
    const entityManager = {
      query: jest.fn().mockResolvedValue([[row], 1]),
    };
    const repository = new SQLRefreshSessionsRepository(entityManager as never);

    await expect(
      repository.create({
        userId: row.userId,
        deviceId: row.deviceId,
        deviceLabel: row.deviceLabel,
        tokenHash: row.tokenHash,
        userAgent: row.userAgent,
        ipAddress: row.ipAddress,
        expiresAt: row.expiresAt,
      }),
    ).resolves.toMatchObject({ id: row.id, userId: row.userId });
  });
});
