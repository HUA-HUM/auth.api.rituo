import {
  AuthIdentity,
  AuthProvider,
  CreateAuthIdentityData,
} from '../../../entities/authIdentities/AuthIdentity';

export const AUTH_IDENTITIES_REPOSITORY = Symbol('AUTH_IDENTITIES_REPOSITORY');

export interface IAuthIdentitiesRepository {
  findByProviderSubject(
    provider: AuthProvider,
    providerSubject: string,
  ): Promise<AuthIdentity | null>;
  create(data: CreateAuthIdentityData): Promise<AuthIdentity>;
}
