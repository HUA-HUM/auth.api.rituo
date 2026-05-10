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

    request.auth = {
      userId: payload.sub,
      sessionId: payload.sessionId,
    };

    return true;
  }
}
