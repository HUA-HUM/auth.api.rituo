import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { REFRESH_SESSIONS_REPOSITORY } from '../../adapters/repositories/refreshSessions/IRefreshSessionsRepository';
import type { IRefreshSessionsRepository } from '../../adapters/repositories/refreshSessions/IRefreshSessionsRepository';
import { TOKEN_HASHER } from '../../adapters/services/jwtAuth/ITokenHasher';
import type { ITokenHasher } from '../../adapters/services/jwtAuth/ITokenHasher';
import { TOKEN_SERVICE } from '../../adapters/services/jwtAuth/ITokenService';
import type { ITokenService } from '../../adapters/services/jwtAuth/ITokenService';
import { USERS_REPOSITORY } from '../../adapters/repositories/users/IUsersRepository';
import type { IUsersRepository } from '../../adapters/repositories/users/IUsersRepository';

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class RefreshTokenInteractor {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject(REFRESH_SESSIONS_REPOSITORY)
    private readonly refreshSessionsRepository: IRefreshSessionsRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
    @Inject(TOKEN_HASHER)
    private readonly tokenHasher: ITokenHasher,
  ) {}

  async execute(refreshToken: string): Promise<RefreshTokenResult> {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);
    const session = await this.refreshSessionsRepository.findById(
      payload.sessionId,
    );

    if (
      !session ||
      !(await this.tokenHasher.compare(refreshToken, session.tokenHash))
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.revokedAt) {
      throw new UnauthorizedException('Refresh session was revoked');
    }

    if (session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh session expired');
    }

    const user = await this.usersRepository.findById(payload.sub);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User is not active');
    }

    const accessToken = await this.tokenService.signAccessToken({
      sub: user.id,
      sessionId: session.id,
    });
    const rotatedRefreshToken = await this.tokenService.signRefreshToken({
      sub: user.id,
      sessionId: session.id,
      typ: 'refresh',
    });

    await this.refreshSessionsRepository.updateTokenHash(
      session.id,
      await this.tokenHasher.hash(rotatedRefreshToken),
    );

    return {
      accessToken,
      refreshToken: rotatedRefreshToken,
    };
  }
}
