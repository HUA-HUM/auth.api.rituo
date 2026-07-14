import {
  CreateEmailPasswordCredentialData,
  EmailPasswordCredential,
} from '../../../entities/emailPasswordCredentials/EmailPasswordCredential';

export const EMAIL_PASSWORD_CREDENTIALS_REPOSITORY = Symbol(
  'EMAIL_PASSWORD_CREDENTIALS_REPOSITORY',
);

export interface IEmailPasswordCredentialsRepository {
  create(
    data: CreateEmailPasswordCredentialData,
  ): Promise<EmailPasswordCredential>;
  findByEmail(email: string): Promise<EmailPasswordCredential | null>;
}
