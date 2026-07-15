import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { EMAIL_PASSWORD_CREDENTIALS_REPOSITORY } from '../../adapters/repositories/emailPasswordCredentials/IEmailPasswordCredentialsRepository';
import type { IEmailPasswordCredentialsRepository } from '../../adapters/repositories/emailPasswordCredentials/IEmailPasswordCredentialsRepository';
import { PASSWORD_RESET_TOKENS_REPOSITORY } from '../../adapters/repositories/passwordResetTokens/IPasswordResetTokensRepository';
import type { IPasswordResetTokensRepository } from '../../adapters/repositories/passwordResetTokens/IPasswordResetTokensRepository';
import { USERS_REPOSITORY } from '../../adapters/repositories/users/IUsersRepository';
import type { IUsersRepository } from '../../adapters/repositories/users/IUsersRepository';
import { EMAIL_SENDER } from '../../adapters/services/email/IEmailSender';
import type { IEmailSender } from '../../adapters/services/email/IEmailSender';
import { env } from '../../../config/env';

export interface ForgotPasswordCommand {
  email: string;
}

@Injectable()
export class ForgotPasswordInteractor {
  private readonly logger = new Logger(ForgotPasswordInteractor.name);

  constructor(
    @Inject(EMAIL_PASSWORD_CREDENTIALS_REPOSITORY)
    private readonly emailPasswordCredentialsRepository: IEmailPasswordCredentialsRepository,
    @Inject(PASSWORD_RESET_TOKENS_REPOSITORY)
    private readonly passwordResetTokensRepository: IPasswordResetTokensRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject(EMAIL_SENDER)
    private readonly emailSender: IEmailSender,
  ) {}

  async execute(command: ForgotPasswordCommand): Promise<void> {
    const email = this.normalizeEmail(command.email);
    const credential =
      await this.emailPasswordCredentialsRepository.findByEmail(email);

    if (!credential) {
      this.logger.log({ event: 'password_reset_requested_unknown_email' });
      return;
    }

    const user = await this.usersRepository.findById(credential.userId);
    if (!user || user.status !== 'active') {
      return;
    }

    const token = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(
      Date.now() + env.passwordResetTokenTtlMinutes * 60 * 1000,
    );

    await this.passwordResetTokensRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    await this.emailSender.sendPasswordResetEmail({
      to: email,
      resetUrl: this.buildResetUrl(token),
    });

    this.logger.log({
      event: 'password_reset_email_sent',
      userId: user.id,
    });
  }

  private normalizeEmail(email: string): string {
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new BadRequestException('email must be valid');
    }

    return normalized;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildResetUrl(token: string): string {
    const url = new URL(env.passwordResetBaseUrl);
    url.searchParams.set('token', token);
    return url.toString();
  }
}
