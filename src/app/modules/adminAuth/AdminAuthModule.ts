import { Module } from '@nestjs/common';
import { VerifyAdminCredentialsInteractor } from '../../../core/interactors/adminAuth/VerifyAdminCredentialsInteractor';
import { AdminAuthController } from '../../controllers/adminAuth/AdminAuthController';
import { JwtAuthModule } from '../jwtAuth/JwtAuthModule';

@Module({
  imports: [JwtAuthModule],
  controllers: [AdminAuthController],
  providers: [VerifyAdminCredentialsInteractor],
})
export class AdminAuthModule {}
