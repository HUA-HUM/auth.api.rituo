import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TOKEN_SERVICE } from '../../../../core/adapters/services/jwtAuth/ITokenService';
import type { ITokenService } from '../../../../core/adapters/services/jwtAuth/ITokenService';
import { REFRESH_SESSIONS_REPOSITORY } from '../../../../core/adapters/repositories/refreshSessions/IRefreshSessionsRepository';
import type { IRefreshSessionsRepository } from '../../../../core/adapters/repositories/refreshSessions/IRefreshSessionsRepository';

export interface AuthenticatedRequest extends Request {
  auth: {
    userId: string;
    sessionId: string;
  };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
    @Inject(REFRESH_SESSIONS_REPOSITORY)
    private readonly refreshSessionsRepository: IRefreshSessionsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const payload = await this.tokenService.verifyAccessToken(
      authorization.slice('Bearer '.length),
    );

    const session = await this.refreshSessionsRepository.findById(
      payload.sessionId,
    );

    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Session was revoked');
    }

    request.auth = {
      userId: payload.sub,
      sessionId: payload.sessionId,
    };

    return true;
  }
}
