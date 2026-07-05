import { SQLAuthIdentitiesRepository } from './SQLAuthIdentitiesRepository';

describe('SQLAuthIdentitiesRepository', () => {
  it('unwraps PostgreSQL mutation results returned by TypeORM', async () => {
    const row = {
      id: 'identity-id',
      userId: 'user-id',
      provider: 'apple',
      providerSubject: 'apple-subject',
      providerEmail: 'user@example.com',
      providerEmailVerified: true,
      createdAt: new Date('2026-07-05T10:00:00.000Z'),
      updatedAt: new Date('2026-07-05T10:00:00.000Z'),
    };
    const entityManager = {
      query: jest.fn().mockResolvedValue([[row], 1]),
    };
    const repository = new SQLAuthIdentitiesRepository(entityManager as never);

    await expect(
      repository.create({
        userId: row.userId,
        provider: 'apple',
        providerSubject: row.providerSubject,
        providerEmail: row.providerEmail,
        providerEmailVerified: true,
      }),
    ).resolves.toMatchObject({ id: row.id, userId: row.userId });
  });
});
