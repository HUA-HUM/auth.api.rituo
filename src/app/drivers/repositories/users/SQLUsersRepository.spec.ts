import { SQLUsersRepository } from './SQLUsersRepository';

describe('SQLUsersRepository', () => {
  it('unwraps PostgreSQL mutation results returned by TypeORM', async () => {
    const row = {
      id: '2d7fe577-d0ad-4eed-9af8-1e72b8153fd1',
      email: 'user@example.com',
      displayName: 'Rituo User',
      emailVerified: true,
      status: 'active',
      createdAt: new Date('2026-07-05T10:00:00.000Z'),
      updatedAt: new Date('2026-07-05T10:00:00.000Z'),
    };
    const entityManager = {
      query: jest.fn().mockResolvedValue([[row], 1]),
    };
    const repository = new SQLUsersRepository(entityManager as never);

    await expect(
      repository.create({
        email: row.email,
        displayName: row.displayName,
        emailVerified: true,
      }),
    ).resolves.toMatchObject({ id: row.id, email: row.email });
  });
});
