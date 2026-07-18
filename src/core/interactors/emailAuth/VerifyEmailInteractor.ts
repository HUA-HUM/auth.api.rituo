import {
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { EMAIL_VERIFICATION_TOKENS_REPOSITORY } from '../../adapters/repositories/emailVerificationTokens/IEmailVerificationTokensRepository';
import type { IEmailVerificationTokensRepository } from '../../adapters/repositories/emailVerificationTokens/IEmailVerificationTokensRepository';
import { USERS_REPOSITORY } from '../../adapters/repositories/users/IUsersRepository';
import type { IUsersRepository } from '../../adapters/repositories/users/IUsersRepository';
import { User } from '../../entities/users/User';

export interface VerifyEmailCommand {
  token: string;
}

@Injectable()
export class VerifyEmailInteractor {
  constructor(
    @Inject(EMAIL_VERIFICATION_TOKENS_REPOSITORY)
    private readonly emailVerificationTokensRepository: IEmailVerificationTokensRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async execute(command: VerifyEmailCommand): Promise<User> {
    const verificationToken =
      await this.emailVerificationTokensRepository.useValidToken(
        this.hashToken(command.token),
      );

    if (!verificationToken) {
      throw new UnauthorizedException(
        'Invalid or expired email verification token',
      );
    }

    return this.usersRepository.markEmailVerified(verificationToken.userId);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
