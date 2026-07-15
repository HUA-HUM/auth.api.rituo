import { Module } from '@nestjs/common';
import { EMAIL_SENDER } from '../../../core/adapters/services/email/IEmailSender';
import { ForgotPasswordInteractor } from '../../../core/interactors/emailAuth/ForgotPasswordInteractor';
import { RegisterWithEmailInteractor } from '../../../core/interactors/emailAuth/RegisterWithEmailInteractor';
import { ResetPasswordInteractor } from '../../../core/interactors/emailAuth/ResetPasswordInteractor';
import { SignInWithEmailInteractor } from '../../../core/interactors/emailAuth/SignInWithEmailInteractor';
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
    {
      provide: EMAIL_SENDER,
      useClass: ResendEmailSender,
    },
  ],
})
export class EmailAuthModule {}
