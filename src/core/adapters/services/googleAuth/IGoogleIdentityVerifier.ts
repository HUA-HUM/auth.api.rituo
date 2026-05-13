export const GOOGLE_IDENTITY_VERIFIER = Symbol('GOOGLE_IDENTITY_VERIFIER');

export interface VerifiedGoogleIdentity {
  providerSubject: string;
  email: string | null;
  emailVerified: boolean;
}

export interface IGoogleIdentityVerifier {
  verify(identityToken: string): Promise<VerifiedGoogleIdentity>;
}
