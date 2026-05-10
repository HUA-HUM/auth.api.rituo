import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { REFRESH_SESSIONS_REPOSITORY } from '../../adapters/repositories/refreshSessions/IRefreshSessionsRepository';
import type { IRefreshSessionsRepository } from '../../adapters/repositories/refreshSessions/IRefreshSessionsRepository';
import { TOKEN_HASHER } from '../../adapters/services/jwtAuth/ITokenHasher';
import type { ITokenHasher } from '../../adapters/services/jwtAuth/ITokenHasher';
import { TOKEN_SERVICE } from '../../adapters/services/jwtAuth/ITokenService';
import type { ITokenService } from '../../adapters/services/jwtAuth/ITokenService';

@Injectable()
export class LogoutInteractor {
  constructor(
    @Inject(REFRESH_SESSIONS_REPOSITORY)
    private readonly refreshSessionsRepository: IRefreshSessionsRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
    @Inject(TOKEN_HASHER)
    private readonly tokenHasher: ITokenHasher,
  ) {}

  async execute(refreshToken: string): Promise<void> {
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

    await this.refreshSessionsRepository.revoke(session.id);
  }
}
