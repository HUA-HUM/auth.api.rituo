import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { env } from '../../../config/env';
import { USERS_REPOSITORY } from '../../../core/adapters/repositories/users/IUsersRepository';
import { AUTH_IDENTITIES_REPOSITORY } from '../../../core/adapters/repositories/authIdentities/IAuthIdentitiesRepository';
import { REFRESH_SESSIONS_REPOSITORY } from '../../../core/adapters/repositories/refreshSessions/IRefreshSessionsRepository';
import { SQLUsersRepository } from '../../drivers/repositories/users/SQLUsersRepository';
import { SQLAuthIdentitiesRepository } from '../../drivers/repositories/authIdentities/SQLAuthIdentitiesRepository';
import { SQLRefreshSessionsRepository } from '../../drivers/repositories/refreshSessions/SQLRefreshSessionsRepository';

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
  ],
  exports: [
    USERS_REPOSITORY,
    AUTH_IDENTITIES_REPOSITORY,
    REFRESH_SESSIONS_REPOSITORY,
  ],
})
export class DatabaseModule {}
