import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { EMAIL_VERIFICATION_TOKENS_REPOSITORY } from '../../adapters/repositories/emailVerificationTokens/IEmailVerificationTokensRepository';
import type { IEmailVerificationTokensRepository } from '../../adapters/repositories/emailVerificationTokens/IEmailVerificationTokensRepository';
import { USERS_REPOSITORY } from '../../adapters/repositories/users/IUsersRepository';
import type { IUsersRepository } from '../../adapters/repositories/users/IUsersRepository';
import { EMAIL_SENDER } from '../../adapters/services/email/IEmailSender';
import type { IEmailSender } from '../../adapters/services/email/IEmailSender';
import { env } from '../../../config/env';

export interface SendEmailVerificationCommand {
  email: string;
}

@Injectable()
export class SendEmailVerificationInteractor {
  private readonly logger = new Logger(SendEmailVerificationInteractor.name);

  constructor(
    @Inject(EMAIL_VERIFICATION_TOKENS_REPOSITORY)
    private readonly emailVerificationTokensRepository: IEmailVerificationTokensRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject(EMAIL_SENDER)
    private readonly emailSender: IEmailSender,
  ) {}

  async execute(command: SendEmailVerificationCommand): Promise<void> {
    const email = this.normalizeEmail(command.email);
    const user = await this.usersRepository.findByEmail(email);

    if (!user || user.status !== 'active' || user.emailVerified) {
      return;
    }

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      Date.now() + env.emailVerificationTokenTtlMinutes * 60 * 1000,
    );

    await this.emailVerificationTokensRepository.create({
      userId: user.id,
      tokenHash: this.hashToken(token),
      expiresAt,
    });

    await this.emailSender.sendEmailVerificationEmail({
      to: email,
      verifyUrl: this.buildVerifyUrl(token),
    });

    this.logger.log({
      event: 'email_verification_email_sent',
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

  private buildVerifyUrl(token: string): string {
    const url = new URL(env.emailVerificationBaseUrl);
    url.searchParams.set('token', token);
    return url.toString();
  }
}
