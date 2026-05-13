import { Module } from '@nestjs/common';
import { GOOGLE_IDENTITY_VERIFIER } from '../../../core/adapters/services/googleAuth/IGoogleIdentityVerifier';
import { SignInWithGoogleInteractor } from '../../../core/interactors/googleAuth/SignInWithGoogleInteractor';
import { GoogleAuthController } from '../../controllers/googleAuth/GoogleAuthController';
import { GoogleIdentityVerifier } from '../../services/googleAuth/GoogleIdentityVerifierService';
import { JwtAuthModule } from '../jwtAuth/JwtAuthModule';

@Module({
  imports: [JwtAuthModule],
  controllers: [GoogleAuthController],
  providers: [
    SignInWithGoogleInteractor,
    {
      provide: GOOGLE_IDENTITY_VERIFIER,
      useClass: GoogleIdentityVerifier,
    },
  ],
})
export class GoogleAuthModule {}
