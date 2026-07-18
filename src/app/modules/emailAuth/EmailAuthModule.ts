import { Module } from '@nestjs/common';
import { EMAIL_SENDER } from '../../../core/adapters/services/email/IEmailSender';
import { ForgotPasswordInteractor } from '../../../core/interactors/emailAuth/ForgotPasswordInteractor';
import { RegisterWithEmailInteractor } from '../../../core/interactors/emailAuth/RegisterWithEmailInteractor';
import { ResetPasswordInteractor } from '../../../core/interactors/emailAuth/ResetPasswordInteractor';
import { SendEmailVerificationInteractor } from '../../../core/interactors/emailAuth/SendEmailVerificationInteractor';
import { SignInWithEmailInteractor } from '../../../core/interactors/emailAuth/SignInWithEmailInteractor';
import { VerifyEmailInteractor } from '../../../core/interactors/emailAuth/VerifyEmailInteractor';
import { EmailAuthController } from '../../controllers/emailAuth/EmailAuthController';
import { ResendEmailSender } from '../../services/email/ResendEmailSender';
import { JwtAuthModule } from '../jwtAuth/JwtAuthModule';

@Module({
  imports: [JwtAuthModule],
  controllers: [EmailAuthController],
  providers: [
    RegisterWithEmailInteractor,
    SignInWithEmailInteractor,
    ForgotPasswordInteractor,
    ResetPasswordInteractor,
    SendEmailVerificationInteractor,
    VerifyEmailInteractor,
    {
      provide: EMAIL_SENDER,
      useClass: ResendEmailSender,
    },
  ],
})
export class EmailAuthModule {}
