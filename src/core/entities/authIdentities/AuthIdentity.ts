export type AuthProvider = 'apple' | 'google';

export interface AuthIdentity {
  id: string;
  userId: string;
  provider: AuthProvider;
  providerSubject: string;
  providerEmail: string | null;
  providerEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAuthIdentityData {
  userId: string;
  provider: AuthProvider;
  providerSubject: string;
  providerEmail: string | null;
  providerEmailVerified: boolean;
}
