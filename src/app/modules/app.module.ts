import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from '../controllers/app.controller';
import { DatabaseModule } from './database/DatabaseModule';
import { AppleAuthModule } from './appleAuth/AppleAuthModule';
import { GoogleAuthModule } from './googleAuth/GoogleAuthModule';
import { JwtAuthModule } from './jwtAuth/JwtAuthModule';
import { HealthModule } from './health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AppleAuthModule,
    GoogleAuthModule,
    JwtAuthModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
