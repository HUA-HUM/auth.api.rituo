import { SignInWithEmailInteractor } from './SignInWithEmailInteractor';

describe('SignInWithEmailInteractor client metadata', () => {
  const user = {
    id: 'user-id',
    email: 'user@rituo.io',
    displayName: 'Rituo User',
    emailVerified: true,
    status: 'active' as const,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  };

  function setup() {
    const usersRepository = {
      findById: jest.fn().mockResolvedValue(user),
    };
    const credentialsRepository = {
      findByEmail: jest.fn().mockResolvedValue({
        userId: user.id,
        email: user.email,
        passwordHash: 'password-hash',
      }),
    };
    const refreshSessionsRepository = {
      create: jest.fn().mockImplementation(async (data) => ({
        id: 'session-id',
        ...data,
        revokedAt: null,
        lastUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      updateTokenHash: jest.fn().mockResolvedValue(undefined),
      revokeActiveSessionsForUserExcept: jest.fn().mockResolvedValue(undefined),
    };
    const tokenService = {
      signAccessToken: jest.fn().mockResolvedValue('access-token'),
      signRefreshToken: jest.fn().mockResolvedValue('refresh-token'),
    };
    const tokenHasher = {
      compare: jest.fn().mockResolvedValue(true),
      hash: jest.fn().mockResolvedValue('token-hash'),
    };

    const interactor = new SignInWithEmailInteractor(
      usersRepository as never,
      credentialsRepository as never,
      refreshSessionsRepository as never,
      tokenService as never,
      tokenHasher as never,
    );

    return { interactor, refreshSessionsRepository, tokenService };
  }

  it('defaults the current iOS login payload to iOS', async () => {
    const { interactor, refreshSessionsRepository, tokenService } = setup();

    await interactor.execute({
      email: user.email,
      password: 'password',
      deviceId: 'legacy-iphone',
      deviceLabel: 'iPhone',
    });

    expect(refreshSessionsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: 'legacy-iphone',
        platform: 'ios',
        appVersion: null,
        appBuild: null,
      }),
    );
    expect(tokenService.signAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: 'legacy-iphone',
        platform: 'ios',
      }),
    );
  });

  it('persists Android platform and version metadata', async () => {
    const { interactor, refreshSessionsRepository, tokenService } = setup();

    await interactor.execute({
      email: user.email,
      password: 'password',
      deviceId: 'android-installation-id',
      deviceLabel: 'Pixel 9',
      platform: 'android',
      appVersion: '1.0.0',
      appBuild: '12',
    });

    expect(refreshSessionsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: 'android-installation-id',
        platform: 'android',
        appVersion: '1.0.0',
        appBuild: '12',
      }),
    );
    expect(tokenService.signRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: 'android-installation-id',
        platform: 'android',
      }),
    );
  });
});
