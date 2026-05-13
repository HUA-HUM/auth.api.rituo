import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AUTH_IDENTITIES_REPOSITORY } from '../../adapters/repositories/authIdentities/IAuthIdentitiesRepository';
import type { IAuthIdentitiesRepository } from '../../adapters/repositories/authIdentities/IAuthIdentitiesRepository';
import { REFRESH_SESSIONS_REPOSITORY } from '../../adapters/repositories/refreshSessions/IRefreshSessionsRepository';
import type { IRefreshSessionsRepository } from '../../adapters/repositories/refreshSessions/IRefreshSessionsRepository';
import { USERS_REPOSITORY } from '../../adapters/repositories/users/IUsersRepository';
import type { IUsersRepository } from '../../adapters/repositories/users/IUsersRepository';
import { GOOGLE_IDENTITY_VERIFIER } from '../../adapters/services/googleAuth/IGoogleIdentityVerifier';
import type { IGoogleIdentityVerifier } from '../../adapters/services/googleAuth/IGoogleIdentityVerifier';
import { TOKEN_HASHER } from '../../adapters/services/jwtAuth/ITokenHasher';
import type { ITokenHasher } from '../../adapters/services/jwtAuth/ITokenHasher';
import { TOKEN_SERVICE } from '../../adapters/services/jwtAuth/ITokenService';
import type { ITokenService } from '../../adapters/services/jwtAuth/ITokenService';
import { GoogleAuthResult } from '../../entities/googleAuth/GoogleAuthResult';
import { User } from '../../entities/users/User';
import { env } from '../../../config/env';
import { ttlToMilliseconds } from '../common/ttlToMilliseconds';

export interface SignInWithGoogleCommand {
  identityToken: string;
  deviceId: string;
  deviceLabel?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}

@Injectable()
export class SignInWithGoogleInteractor {
  private readonly logger = new Logger(SignInWithGoogleInteractor.name);

  constructor(
    @Inject(GOOGLE_IDENTITY_VERIFIER)
    private readonly googleIdentityVerifier: IGoogleIdentityVerifier,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject(AUTH_IDENTITIES_REPOSITORY)
    private readonly authIdentitiesRepository: IAuthIdentitiesRepository,
    @Inject(REFRESH_SESSIONS_REPOSITORY)
    private readonly refreshSessionsRepository: IRefreshSessionsRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
    @Inject(TOKEN_HASHER)
    private readonly tokenHasher: ITokenHasher,
  ) {}

  async execute(command: SignInWithGoogleCommand): Promise<GoogleAuthResult> {
    const googleIdentity = await this.googleIdentityVerifier.verify(
      command.identityToken,
    );

    const existingIdentity =
      await this.authIdentitiesRepository.findByProviderSubject(
        'google',
        googleIdentity.providerSubject,
      );

    let user: User | null;
    let isNewUser = false;

    if (existingIdentity) {
      user = await this.usersRepository.findById(existingIdentity.userId);
      if (!user) {
        throw new UnauthorizedException('Google identity user was not found');
      }
    } else {
      user = await this.usersRepository.create({
        email: googleIdentity.email,
        displayName: null,
        emailVerified: googleIdentity.emailVerified,
      });
      isNewUser = true;

      await this.authIdentitiesRepository.create({
        userId: user.id,
        provider: 'google',
        providerSubject: googleIdentity.providerSubject,
        providerEmail: googleIdentity.email,
        providerEmailVerified: googleIdentity.emailVerified,
      });

      this.logger.log({
        event: 'user_registered',
        provider: 'google',
        userId: user.id,
        providerSubject: googleIdentity.providerSubject,
      });
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('User is disabled');
    }

    const expiresAt = new Date(
      Date.now() + ttlToMilliseconds(env.jwtRefreshTtl),
    );
    const temporaryTokenHash = await this.tokenHasher.hash(randomUUID());

    const session = await this.refreshSessionsRepository.create({
      userId: user.id,
      deviceId: command.deviceId,
      deviceLabel: command.deviceLabel ?? null,
      tokenHash: temporaryTokenHash,
      userAgent: command.userAgent ?? null,
      ipAddress: command.ipAddress ?? null,
      expiresAt,
    });

    const accessToken = await this.tokenService.signAccessToken({
      sub: user.id,
      sessionId: session.id,
    });

    const refreshToken = await this.tokenService.signRefreshToken({
      sub: user.id,
      sessionId: session.id,
      typ: 'refresh',
    });

    await this.refreshSessionsRepository.updateTokenHash(
      session.id,
      await this.tokenHasher.hash(refreshToken),
    );

    this.logger.log({
      event: 'user_signed_in',
      provider: 'google',
      userId: user.id,
      sessionId: session.id,
      deviceId: command.deviceId,
      isNewUser,
    });

    return {
      accessToken,
      refreshToken,
      user,
    };
  }
}
