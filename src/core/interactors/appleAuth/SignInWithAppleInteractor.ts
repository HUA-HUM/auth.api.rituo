import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { APPLE_IDENTITY_VERIFIER } from '../../adapters/services/appleAuth/IAppleIdentityVerifier';
import type { IAppleIdentityVerifier } from '../../adapters/services/appleAuth/IAppleIdentityVerifier';
import { AUTH_IDENTITIES_REPOSITORY } from '../../adapters/repositories/authIdentities/IAuthIdentitiesRepository';
import type { IAuthIdentitiesRepository } from '../../adapters/repositories/authIdentities/IAuthIdentitiesRepository';
import { REFRESH_SESSIONS_REPOSITORY } from '../../adapters/repositories/refreshSessions/IRefreshSessionsRepository';
import type { IRefreshSessionsRepository } from '../../adapters/repositories/refreshSessions/IRefreshSessionsRepository';
import { USERS_REPOSITORY } from '../../adapters/repositories/users/IUsersRepository';
import type { IUsersRepository } from '../../adapters/repositories/users/IUsersRepository';
import { TOKEN_HASHER } from '../../adapters/services/jwtAuth/ITokenHasher';
import type { ITokenHasher } from '../../adapters/services/jwtAuth/ITokenHasher';
import { TOKEN_SERVICE } from '../../adapters/services/jwtAuth/ITokenService';
import type { ITokenService } from '../../adapters/services/jwtAuth/ITokenService';
import { AppleAuthResult } from '../../entities/appleAuth/AppleAuthResult';
import { User } from '../../entities/users/User';
import { ttlToMilliseconds } from '../common/ttlToMilliseconds';
import { env } from '../../../config/env';

export interface SignInWithAppleCommand {
  identityToken: string;
  deviceId: string;
  authorizationCode?: string | null;
  deviceLabel?: string | null;
  displayName?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}

@Injectable()
export class SignInWithAppleInteractor {
  private readonly logger = new Logger(SignInWithAppleInteractor.name);

  constructor(
    @Inject(APPLE_IDENTITY_VERIFIER)
    private readonly appleIdentityVerifier: IAppleIdentityVerifier,
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

  async execute(command: SignInWithAppleCommand): Promise<AppleAuthResult> {
    const appleIdentity = await this.appleIdentityVerifier.verify(
      command.identityToken,
    );

    const existingIdentity =
      await this.authIdentitiesRepository.findByProviderSubject(
        'apple',
        appleIdentity.providerSubject,
      );

    let user: User | null;
    let isNewUser = false;
    const displayName = this.normalizeDisplayName(command.displayName ?? null);

    if (existingIdentity) {
      user = await this.usersRepository.findById(existingIdentity.userId);
      if (!user) {
        throw new UnauthorizedException('Apple identity user was not found');
      }
      if (!user.displayName && displayName) {
        user = await this.usersRepository.updateProfile(user.id, {
          displayName,
        });
      }
    } else {
      user = await this.findExistingVerifiedEmailUser(
        appleIdentity.email,
        appleIdentity.emailVerified,
      );

      if (!user) {
        user = await this.usersRepository.create({
          email: this.normalizeEmail(appleIdentity.email),
          displayName,
          emailVerified: appleIdentity.emailVerified,
        });
        isNewUser = true;
      } else if (!user.displayName && displayName) {
        user = await this.usersRepository.updateProfile(user.id, {
          displayName,
        });
      }

      this.assertPersistedUser(user, 'before_apple_identity_create');

      await this.authIdentitiesRepository.create({
        userId: user.id,
        provider: 'apple',
        providerSubject: appleIdentity.providerSubject,
        providerEmail: appleIdentity.email,
        providerEmailVerified: appleIdentity.emailVerified,
      });

      this.logger.log({
        event: isNewUser ? 'user_registered' : 'auth_identity_linked',
        provider: 'apple',
        userId: user.id,
        providerSubject: appleIdentity.providerSubject,
      });
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('User is disabled');
    }

    this.assertPersistedUser(user, 'before_apple_session_create');

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
      provider: 'apple',
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

  private async findExistingVerifiedEmailUser(
    email: string | null,
    emailVerified: boolean,
  ): Promise<User | null> {
    const normalizedEmail = this.normalizeEmail(email);

    if (!normalizedEmail || !emailVerified) {
      return null;
    }

    return this.usersRepository.findByEmail(normalizedEmail);
  }

  private normalizeEmail(email: string | null): string | null {
    const normalizedEmail = email?.trim().toLowerCase();
    return normalizedEmail || null;
  }

  private normalizeDisplayName(displayName: string | null): string | null {
    const normalizedDisplayName = displayName?.trim().replace(/\s+/g, ' ');
    return normalizedDisplayName || null;
  }

  private assertPersistedUser(user: User, step: string): void {
    if (!user.id) {
      this.logger.error({
        event: 'invalid_user_without_id',
        provider: 'apple',
        step,
        email: user.email,
      });
      throw new UnauthorizedException('Authenticated user was not persisted');
    }
  }
}
