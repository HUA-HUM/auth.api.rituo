import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import {
  IAppleIdentityVerifier,
  VerifiedAppleIdentity,
} from '../../../core/adapters/services/appleAuth/IAppleIdentityVerifier';
import { env } from '../../../config/env';

const appleJwks = createRemoteJWKSet(
  new URL('https://appleid.apple.com/auth/keys'),
);

@Injectable()
export class AppleIdentityVerifier implements IAppleIdentityVerifier {
  async verify(identityToken: string): Promise<VerifiedAppleIdentity> {
    try {
      const { payload } = await jwtVerify(identityToken, appleJwks, {
        issuer: 'https://appleid.apple.com',
        audience: env.appleClientId,
      });

      if (!payload.sub) {
        throw new UnauthorizedException('Apple identity token has no subject');
      }

      return {
        providerSubject: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : null,
        emailVerified:
          payload.email_verified === true || payload.email_verified === 'true',
      };
    } catch {
      throw new UnauthorizedException('Invalid Apple identity token');
    }
  }
}
