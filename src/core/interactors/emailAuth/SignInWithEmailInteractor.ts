import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { USERS_REPOSITORY } from '../../adapters/repositories/users/IUsersRepository';
import type { IUsersRepository } from '../../adapters/repositories/users/IUsersRepository';
import { EMAIL_PASSWORD_CREDENTIALS_REPOSITORY } from '../../adapters/repositories/emailPasswordCredentials/IEmailPasswordCredentialsRepository';
import type { IEmailPasswordCredentialsRepository } from '../../adapters/repositories/emailPasswordCredentials/IEmailPasswordCredentialsRepository';
import { REFRESH_SESSIONS_REPOSITORY } from '../../adapters/repositories/refreshSessions/IRefreshSessionsRepository';
import type { IRefreshSessionsRepository } from '../../adapters/repositories/refreshSessions/IRefreshSessionsRepository';
import { TOKEN_HASHER } from '../../adapters/services/jwtAuth/ITokenHasher';
import type { ITokenHasher } from '../../adapters/services/jwtAuth/ITokenHasher';
import { TOKEN_SERVICE } from '../../adapters/services/jwtAuth/ITokenService';
import type { ITokenService } from '../../adapters/services/jwtAuth/ITokenService';
import { EmailAuthResult } from '../../entities/emailAuth/EmailAuthResult';
import { User } from '../../entities/users/User';
import { ttlToMilliseconds } from '../common/ttlToMilliseconds';
import { env } from '../../../config/env';
import {
  ClientPlatform,
  normalizeClientPlatform,
  normalizeOptionalClientText,
} from '../../entities/refreshSessions/ClientMetadata';

export interface SignInWithEmailCommand {
  email: string;
  password: string;
  deviceId: string;
  deviceLabel?: string | null;
  platform?: ClientPlatform | null;
  appVersion?: string | null;
  appBuild?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}

@Injectable()
export class SignInWithEmailInteractor {
  private readonly logger = new Logger(SignInWithEmailInteractor.name);

  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject(EMAIL_PASSWORD_CREDENTIALS_REPOSITORY)
    private readonly emailPasswordCredentialsRepository: IEmailPasswordCredentialsRepository,
    @Inject(REFRESH_SESSIONS_REPOSITORY)
    private readonly refreshSessionsRepository: IRefreshSessionsRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
    @Inject(TOKEN_HASHER)
    private readonly tokenHasher: ITokenHasher,
  ) {}

  async execute(command: SignInWithEmailCommand): Promise<EmailAuthResult> {
    const email = command.email.trim().toLowerCase();
    const credential =
      await this.emailPasswordCredentialsRepository.findByEmail(email);

    if (!credential) {
      throw new UnauthorizedException('Email account not found');
    }

    const isPasswordValid = await this.tokenHasher.compare(
      command.password,
      credential.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    const user = await this.usersRepository.findById(credential.userId);

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User is disabled');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException('Email is not verified');
    }

    const result = await this.createSession(user, command);

    this.logger.log({
      event: 'user_signed_in',
      provider: 'email',
      userId: user.id,
      sessionId: result.sessionId,
      deviceId: command.deviceId,
    });

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user,
    };
  }

  private async createSession(
    user: User,
    command: SignInWithEmailCommand,
  ): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
    const expiresAt = new Date(
      Date.now() + ttlToMilliseconds(env.jwtRefreshTtl),
    );
    const temporaryTokenHash = await this.tokenHasher.hash(randomUUID());
    const platform = normalizeClientPlatform(command.platform);

    const session = await this.refreshSessionsRepository.create({
      userId: user.id,
      deviceId: command.deviceId,
      deviceLabel: command.deviceLabel ?? null,
      platform,
      appVersion: normalizeOptionalClientText(command.appVersion),
      appBuild: normalizeOptionalClientText(command.appBuild),
      tokenHash: temporaryTokenHash,
      userAgent: command.userAgent ?? null,
      ipAddress: command.ipAddress ?? null,
      expiresAt,
    });

    const accessToken = await this.tokenService.signAccessToken({
      sub: user.id,
      sessionId: session.id,
      deviceId: session.deviceId,
      platform: session.platform,
    });

    const refreshToken = await this.tokenService.signRefreshToken({
      sub: user.id,
      sessionId: session.id,
      typ: 'refresh',
      deviceId: session.deviceId,
      platform: session.platform,
    });

    await this.refreshSessionsRepository.updateTokenHash(
      session.id,
      await this.tokenHasher.hash(refreshToken),
    );
    await this.refreshSessionsRepository.revokeActiveSessionsForUserExcept(
      user.id,
      session.id,
    );

    return { accessToken, refreshToken, sessionId: session.id };
  }
}
