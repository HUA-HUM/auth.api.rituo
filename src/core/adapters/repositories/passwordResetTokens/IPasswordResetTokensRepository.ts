import {
  CreatePasswordResetTokenData,
  PasswordResetToken,
} from '../../../entities/passwordResetTokens/PasswordResetToken';

export const PASSWORD_RESET_TOKENS_REPOSITORY = Symbol(
  'PASSWORD_RESET_TOKENS_REPOSITORY',
);

export interface IPasswordResetTokensRepository {
  create(data: CreatePasswordResetTokenData): Promise<PasswordResetToken>;
  useValidToken(tokenHash: string): Promise<PasswordResetToken | null>;
}
