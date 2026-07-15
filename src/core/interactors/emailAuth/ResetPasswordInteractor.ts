import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { EMAIL_PASSWORD_CREDENTIALS_REPOSITORY } from '../../adapters/repositories/emailPasswordCredentials/IEmailPasswordCredentialsRepository';
import type { IEmailPasswordCredentialsRepository } from '../../adapters/repositories/emailPasswordCredentials/IEmailPasswordCredentialsRepository';
import { PASSWORD_RESET_TOKENS_REPOSITORY } from '../../adapters/repositories/passwordResetTokens/IPasswordResetTokensRepository';
import type { IPasswordResetTokensRepository } from '../../adapters/repositories/passwordResetTokens/IPasswordResetTokensRepository';
import { REFRESH_SESSIONS_REPOSITORY } from '../../adapters/repositories/refreshSessions/IRefreshSessionsRepository';
import type { IRefreshSessionsRepository } from '../../adapters/repositories/refreshSessions/IRefreshSessionsRepository';
import { TOKEN_HASHER } from '../../adapters/services/jwtAuth/ITokenHasher';
import type { ITokenHasher } from '../../adapters/services/jwtAuth/ITokenHasher';

export interface ResetPasswordCommand {
  token: string;
  newPassword: string;
  newPasswordConfirmation: string;
}

@Injectable()
export class ResetPasswordInteractor {
  constructor(
    @Inject(PASSWORD_RESET_TOKENS_REPOSITORY)
    private readonly passwordResetTokensRepository: IPasswordResetTokensRepository,
    @Inject(EMAIL_PASSWORD_CREDENTIALS_REPOSITORY)
    private readonly emailPasswordCredentialsRepository: IEmailPasswordCredentialsRepository,
    @Inject(REFRESH_SESSIONS_REPOSITORY)
    private readonly refreshSessionsRepository: IRefreshSessionsRepository,
    @Inject(TOKEN_HASHER)
    private readonly tokenHasher: ITokenHasher,
  ) {}

  async execute(command: ResetPasswordCommand): Promise<void> {
    this.validatePassword(command.newPassword, command.newPasswordConfirmation);

    const resetToken = await this.passwordResetTokensRepository.useValidToken(
      this.hashToken(command.token),
    );

    if (!resetToken) {
      throw new UnauthorizedException('Invalid or expired password reset token');
    }

    const credential =
      await this.emailPasswordCredentialsRepository.findByUserId(
        resetToken.userId,
      );

    if (!credential) {
      throw new UnauthorizedException('Email credentials not found');
    }

    await this.emailPasswordCredentialsRepository.updatePasswordHash(
      resetToken.userId,
      await this.tokenHasher.hash(command.newPassword),
    );
    await this.refreshSessionsRepository.revokeActiveSessionsForUser(
      resetToken.userId,
    );
  }

  private validatePassword(
    password: string,
    passwordConfirmation: string,
  ): void {
    if (password !== passwordConfirmation) {
      throw new BadRequestException('password confirmation does not match');
    }

    if (password.length < 8 || password.length > 72) {
      throw new BadRequestException(
        'password must contain between 8 and 72 characters',
      );
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
