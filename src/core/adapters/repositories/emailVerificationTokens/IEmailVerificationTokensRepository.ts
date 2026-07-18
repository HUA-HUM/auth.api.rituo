import {
  CreateEmailVerificationTokenData,
  EmailVerificationToken,
} from '../../../entities/emailVerificationTokens/EmailVerificationToken';

export const EMAIL_VERIFICATION_TOKENS_REPOSITORY = Symbol(
  'EMAIL_VERIFICATION_TOKENS_REPOSITORY',
);

export interface IEmailVerificationTokensRepository {
  create(
    data: CreateEmailVerificationTokenData,
  ): Promise<EmailVerificationToken>;
  useValidToken(tokenHash: string): Promise<EmailVerificationToken | null>;
}
