import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { env } from '../../../config/env';
import { USERS_REPOSITORY } from '../../../core/adapters/repositories/users/IUsersRepository';
import { AUTH_IDENTITIES_REPOSITORY } from '../../../core/adapters/repositories/authIdentities/IAuthIdentitiesRepository';
import { REFRESH_SESSIONS_REPOSITORY } from '../../../core/adapters/repositories/refreshSessions/IRefreshSessionsRepository';
import { EMAIL_PASSWORD_CREDENTIALS_REPOSITORY } from '../../../core/adapters/repositories/emailPasswordCredentials/IEmailPasswordCredentialsRepository';
import { PASSWORD_RESET_TOKENS_REPOSITORY } from '../../../core/adapters/repositories/passwordResetTokens/IPasswordResetTokensRepository';
import { SQLUsersRepository } from '../../drivers/repositories/users/SQLUsersRepository';
import { SQLAuthIdentitiesRepository } from '../../drivers/repositories/authIdentities/SQLAuthIdentitiesRepository';
import { SQLRefreshSessionsRepository } from '../../drivers/repositories/refreshSessions/SQLRefreshSessionsRepository';
import { SQLEmailPasswordCredentialsRepository } from '../../drivers/repositories/emailPasswordCredentials/SQLEmailPasswordCredentialsRepository';
import { SQLPasswordResetTokensRepository } from '../../drivers/repositories/passwordResetTokens/SQLPasswordResetTokensRepository';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: env.databaseUrl,
      synchronize: false,
      entities: [],
    }),
  ],
  providers: [
    {
      provide: USERS_REPOSITORY,
      useClass: SQLUsersRepository,
    },
    {
      provide: AUTH_IDENTITIES_REPOSITORY,
      useClass: SQLAuthIdentitiesRepository,
    },
    {
      provide: REFRESH_SESSIONS_REPOSITORY,
      useClass: SQLRefreshSessionsRepository,
    },
    {
      provide: EMAIL_PASSWORD_CREDENTIALS_REPOSITORY,
      useClass: SQLEmailPasswordCredentialsRepository,
    },
    {
      provide: PASSWORD_RESET_TOKENS_REPOSITORY,
      useClass: SQLPasswordResetTokensRepository,
    },
  ],
  exports: [
    USERS_REPOSITORY,
    AUTH_IDENTITIES_REPOSITORY,
    REFRESH_SESSIONS_REPOSITORY,
    EMAIL_PASSWORD_CREDENTIALS_REPOSITORY,
    PASSWORD_RESET_TOKENS_REPOSITORY,
  ],
})
export class DatabaseModule {}
