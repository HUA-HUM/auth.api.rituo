import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { USERS_REPOSITORY } from '../../adapters/repositories/users/IUsersRepository';
import type { IUsersRepository } from '../../adapters/repositories/users/IUsersRepository';
import { EMAIL_PASSWORD_CREDENTIALS_REPOSITORY } from '../../adapters/repositories/emailPasswordCredentials/IEmailPasswordCredentialsRepository';
import type { IEmailPasswordCredentialsRepository } from '../../adapters/repositories/emailPasswordCredentials/IEmailPasswordCredentialsRepository';
import { ADMIN_USERS_REPOSITORY } from '../../adapters/repositories/adminUsers/IAdminUsersRepository';
import type { IAdminUsersRepository } from '../../adapters/repositories/adminUsers/IAdminUsersRepository';
import { TOKEN_HASHER } from '../../adapters/services/jwtAuth/ITokenHasher';
import type { ITokenHasher } from '../../adapters/services/jwtAuth/ITokenHasher';

export interface VerifyAdminCredentialsCommand {
  email: string;
  password: string;
}

export interface VerifiedAdmin {
  id: string;
  email: string | null;
  displayName: string | null;
}

/**
 * Verifies email/password + admin_users membership WITHOUT creating a
 * refresh_sessions row. Reusing the mobile sign-in flow here would revoke
 * the caller's other active sessions (see SignInWithEmailInteractor), which
 * would silently log an admin out of their own phone every time they open
 * the web panel — so this stays a separate, stateless check.
 */
@Injectable()
export class VerifyAdminCredentialsInteractor {
  private readonly logger = new Logger(VerifyAdminCredentialsInteractor.name);

  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject(EMAIL_PASSWORD_CREDENTIALS_REPOSITORY)
    private readonly emailPasswordCredentialsRepository: IEmailPasswordCredentialsRepository,
    @Inject(ADMIN_USERS_REPOSITORY)
    private readonly adminUsersRepository: IAdminUsersRepository,
    @Inject(TOKEN_HASHER)
    private readonly tokenHasher: ITokenHasher,
  ) {}

  async execute(
    command: VerifyAdminCredentialsCommand,
  ): Promise<VerifiedAdmin> {
    const email = command.email.trim().toLowerCase();
    const credential =
      await this.emailPasswordCredentialsRepository.findByEmail(email);

    if (
      !credential ||
      !(await this.tokenHasher.compare(
        command.password,
        credential.passwordHash,
      ))
    ) {
      this.logger.warn({
        event: 'admin_login_rejected',
        reason: 'invalid_credentials',
        email,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.usersRepository.findById(credential.userId);

    if (!user || user.status !== 'active') {
      this.logger.warn({
        event: 'admin_login_rejected',
        reason: 'user_disabled',
        userId: credential.userId,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isAdmin = await this.adminUsersRepository.isAdmin(user.id);

    if (!isAdmin) {
      this.logger.warn({
        event: 'admin_login_rejected',
        reason: 'not_admin',
        userId: user.id,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log({ event: 'admin_login_succeeded', userId: user.id });

    return { id: user.id, email: user.email, displayName: user.displayName };
  }
}
