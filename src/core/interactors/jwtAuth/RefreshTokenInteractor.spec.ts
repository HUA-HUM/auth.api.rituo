import { RefreshTokenInteractor } from './RefreshTokenInteractor';

describe('RefreshTokenInteractor client metadata', () => {
  it('preserves platform and device in rotated tokens', async () => {
    const session = {
      id: 'session-id',
      userId: 'user-id',
      deviceId: 'android-installation-id',
      deviceLabel: 'Pixel 9',
      platform: 'android' as const,
      appVersion: '1.0.0',
      appBuild: '12',
      tokenHash: 'stored-hash',
      userAgent: 'rituo-android',
      ipAddress: '127.0.0.1',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      lastUsedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const user = {
      id: session.userId,
      email: 'user@rituo.io',
      displayName: 'Rituo User',
      emailVerified: true,
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const usersRepository = {
      findById: jest.fn().mockResolvedValue(user),
    };
    const refreshSessionsRepository = {
      findById: jest.fn().mockResolvedValue(session),
      updateTokenHash: jest.fn().mockResolvedValue(undefined),
    };
    const tokenService = {
      verifyRefreshToken: jest.fn().mockResolvedValue({
        sub: user.id,
        sessionId: session.id,
        typ: 'refresh',
      }),
      signAccessToken: jest.fn().mockResolvedValue('new-access-token'),
      signRefreshToken: jest.fn().mockResolvedValue('new-refresh-token'),
    };
    const tokenHasher = {
      compare: jest.fn().mockResolvedValue(true),
      hash: jest.fn().mockResolvedValue('new-token-hash'),
    };
    const interactor = new RefreshTokenInteractor(
      usersRepository as never,
      refreshSessionsRepository as never,
      tokenService as never,
      tokenHasher as never,
    );

    await interactor.execute('old-refresh-token');

    expect(tokenService.signAccessToken).toHaveBeenCalledWith({
      sub: user.id,
      sessionId: session.id,
      deviceId: session.deviceId,
      platform: 'android',
    });
    expect(tokenService.signRefreshToken).toHaveBeenCalledWith({
      sub: user.id,
      sessionId: session.id,
      typ: 'refresh',
      deviceId: session.deviceId,
      platform: 'android',
    });
  });
});
