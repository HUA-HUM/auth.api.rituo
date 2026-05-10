import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TOKEN_HASHER } from '../../../core/adapters/services/jwtAuth/ITokenHasher';
import { TOKEN_SERVICE } from '../../../core/adapters/services/jwtAuth/ITokenService';
import { GetCurrentUserInteractor } from '../../../core/interactors/jwtAuth/GetCurrentUserInteractor';
import { LogoutInteractor } from '../../../core/interactors/jwtAuth/LogoutInteractor';
import { RefreshTokenInteractor } from '../../../core/interactors/jwtAuth/RefreshTokenInteractor';
import { JwtAuthController } from '../../controllers/jwtAuth/JwtAuthController';
import { BcryptTokenHasher } from '../../services/jwtAuth/BcryptTokenHasher';
import { JwtTokenService } from '../../services/jwtAuth/JwtTokenService';
import { JwtAuthGuard } from '../../services/jwtAuth/guards/JwtAuthGuard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [JwtAuthController],
  providers: [
    RefreshTokenInteractor,
    LogoutInteractor,
    GetCurrentUserInteractor,
    JwtAuthGuard,
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
    {
      provide: TOKEN_HASHER,
      useClass: BcryptTokenHasher,
    },
  ],
  exports: [TOKEN_SERVICE, TOKEN_HASHER, JwtAuthGuard],
})
export class JwtAuthModule {}
