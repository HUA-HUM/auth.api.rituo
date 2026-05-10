import { Module } from '@nestjs/common';
import { APPLE_IDENTITY_VERIFIER } from '../../../core/adapters/services/appleAuth/IAppleIdentityVerifier';
import { SignInWithAppleInteractor } from '../../../core/interactors/appleAuth/SignInWithAppleInteractor';
import { AppleAuthController } from '../../controllers/appleAuth/AppleAuthController';
import { AppleIdentityVerifier } from '../../services/appleAuth/AppleIdentityVerifierService';
import { JwtAuthModule } from '../jwtAuth/JwtAuthModule';

@Module({
  imports: [JwtAuthModule],
  controllers: [AppleAuthController],
  providers: [
    SignInWithAppleInteractor,
    {
      provide: APPLE_IDENTITY_VERIFIER,
      useClass: AppleIdentityVerifier,
    },
  ],
})
export class AppleAuthModule {}
