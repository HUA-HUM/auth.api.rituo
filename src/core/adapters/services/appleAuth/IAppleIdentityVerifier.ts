export const APPLE_IDENTITY_VERIFIER = Symbol('APPLE_IDENTITY_VERIFIER');

export interface VerifiedAppleIdentity {
  providerSubject: string;
  email: string | null;
  emailVerified: boolean;
}

export interface IAppleIdentityVerifier {
  verify(identityToken: string): Promise<VerifiedAppleIdentity>;
}
