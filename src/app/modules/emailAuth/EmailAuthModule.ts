import { Module } from '@nestjs/common';
import { RegisterWithEmailInteractor } from '../../../core/interactors/emailAuth/RegisterWithEmailInteractor';
import { SignInWithEmailInteractor } from '../../../core/interactors/emailAuth/SignInWithEmailInteractor';
import { EmailAuthController } from '../../controllers/emailAuth/EmailAuthController';
import { JwtAuthModule } from '../jwtAuth/JwtAuthModule';

@Module({
  imports: [JwtAuthModule],
  controllers: [EmailAuthController],
  providers: [RegisterWithEmailInteractor, SignInWithEmailInteractor],
})
export class EmailAuthModule {}
