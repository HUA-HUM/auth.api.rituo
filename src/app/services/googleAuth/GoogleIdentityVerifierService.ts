import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import {
  IGoogleIdentityVerifier,
  VerifiedGoogleIdentity,
} from '../../../core/adapters/services/googleAuth/IGoogleIdentityVerifier';
import { env } from '../../../config/env';

const googleJwks = createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs'),
);

@Injectable()
export class GoogleIdentityVerifier implements IGoogleIdentityVerifier {
  async verify(identityToken: string): Promise<VerifiedGoogleIdentity> {
    try {
      const { payload } = await jwtVerify(identityToken, googleJwks, {
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
        audience: env.googleClientId,
      });

      if (!payload.sub) {
        throw new UnauthorizedException('Google identity token has no subject');
      }

      return {
        providerSubject: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : null,
        emailVerified: payload.email_verified === true,
        displayName:
          typeof payload.name === 'string' ? this.normalizeName(payload.name) : null,
      };
    } catch {
      throw new UnauthorizedException('Invalid Google identity token');
    }
  }

  private normalizeName(name: string): string | null {
    const normalizedName = name.trim().replace(/\s+/g, ' ');
    return normalizedName || null;
  }
}
