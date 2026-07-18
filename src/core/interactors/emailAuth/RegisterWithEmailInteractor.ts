import {
  BadRequestException,
  ConflictException,
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
import { SendEmailVerificationInteractor } from './SendEmailVerificationInteractor';

export interface RegisterWithEmailCommand {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  deviceId: string;
  deviceLabel?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}

@Injectable()
export class RegisterWithEmailInteractor {
  private readonly logger = new Logger(RegisterWithEmailInteractor.name);

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
    private readonly sendEmailVerificationInteractor: SendEmailVerificationInteractor,
  ) {}

  async execute(command: RegisterWithEmailCommand): Promise<EmailAuthResult> {
    const email = this.normalizeEmail(command.email);
    const displayName = this.normalizeDisplayName(
      command.firstName,
      command.lastName,
    );
    this.validatePassword(command.password);

    const [existingUser, existingCredential] = await Promise.all([
      this.usersRepository.findByEmail(email),
      this.emailPasswordCredentialsRepository.findByEmail(email),
    ]);

    if (existingUser || existingCredential) {
      throw new ConflictException('email is already registered');
    }

    let user: User = await this.usersRepository.create({
      email,
      displayName,
      emailVerified: false,
    });

    await this.emailPasswordCredentialsRepository.create({
      userId: user.id,
      email,
      passwordHash: await this.tokenHasher.hash(command.password),
    });

    user = await this.usersRepository.findById(user.id).then((foundUser) => {
      if (!foundUser) {
        throw new UnauthorizedException('Registered user was not persisted');
      }
      return foundUser;
    });

    const result = await this.createSession(user, command);

    await this.sendVerificationEmail(email, user.id);

    this.logger.log({
      event: 'user_registered',
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

  private async sendVerificationEmail(email: string, userId: string): Promise<void> {
    try {
      await this.sendEmailVerificationInteractor.execute({ email });
    } catch (error) {
      this.logger.error({
        event: 'email_verification_send_failed_after_register',
        userId,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  private async createSession(
    user: User,
    command: RegisterWithEmailCommand,
  ): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
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
    await this.refreshSessionsRepository.revokeActiveSessionsForUserExcept(
      user.id,
      session.id,
    );

    return { accessToken, refreshToken, sessionId: session.id };
  }

  private normalizeEmail(email: string): string {
    const normalized = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new BadRequestException('email must be valid');
    }

    return normalized;
  }

  private normalizeDisplayName(firstName: string, lastName: string): string {
    const normalizedFirstName = firstName.trim().replace(/\s+/g, ' ');
    const normalizedLastName = lastName.trim().replace(/\s+/g, ' ');
    const displayName = `${normalizedFirstName} ${normalizedLastName}`.trim();

    if (!displayName) {
      throw new BadRequestException('name is required');
    }

    return displayName;
  }

  private validatePassword(password: string): void {
    if (password.length < 8 || password.length > 72) {
      throw new BadRequestException(
        'password must contain between 8 and 72 characters',
      );
    }
  }
}
