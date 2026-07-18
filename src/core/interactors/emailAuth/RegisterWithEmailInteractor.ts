import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { USERS_REPOSITORY } from '../../adapters/repositories/users/IUsersRepository';
import type { IUsersRepository } from '../../adapters/repositories/users/IUsersRepository';
import { EMAIL_PASSWORD_CREDENTIALS_REPOSITORY } from '../../adapters/repositories/emailPasswordCredentials/IEmailPasswordCredentialsRepository';
import type { IEmailPasswordCredentialsRepository } from '../../adapters/repositories/emailPasswordCredentials/IEmailPasswordCredentialsRepository';
import { TOKEN_HASHER } from '../../adapters/services/jwtAuth/ITokenHasher';
import type { ITokenHasher } from '../../adapters/services/jwtAuth/ITokenHasher';
import { User } from '../../entities/users/User';
import { SendEmailVerificationInteractor } from './SendEmailVerificationInteractor';

export interface RegisterWithEmailCommand {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  deviceId: string;
  deviceLabel?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface RegisterWithEmailResult {
  user: User;
  emailVerificationRequired: boolean;
}

@Injectable()
export class RegisterWithEmailInteractor {
  private readonly logger = new Logger(RegisterWithEmailInteractor.name);

  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject(EMAIL_PASSWORD_CREDENTIALS_REPOSITORY)
    private readonly emailPasswordCredentialsRepository: IEmailPasswordCredentialsRepository,
    @Inject(TOKEN_HASHER)
    private readonly tokenHasher: ITokenHasher,
    private readonly sendEmailVerificationInteractor: SendEmailVerificationInteractor,
  ) {}

  async execute(command: RegisterWithEmailCommand): Promise<RegisterWithEmailResult> {
    const email = this.normalizeEmail(command.email);
    const displayName = this.normalizeDisplayName(
      command.firstName,
      command.lastName,
    );
    this.validatePassword(command.password);

    const [existingUser, existingCredential] = await Promise.all([
      this.usersRepository.findByEmail(email),
      this.emailPasswordCredentialsRepository.findByEmail(email),
    ]);

    if (existingUser || existingCredential) {
      throw new ConflictException('email is already registered');
    }

    let user: User = await this.usersRepository.create({
      email,
      displayName,
      emailVerified: false,
    });

    await this.emailPasswordCredentialsRepository.create({
      userId: user.id,
      email,
      passwordHash: await this.tokenHasher.hash(command.password),
    });

    await this.sendVerificationEmail(email, user.id);

    this.logger.log({
      event: 'user_registered',
      provider: 'email',
      userId: user.id,
      deviceId: command.deviceId,
    });

    return {
      user,
      emailVerificationRequired: !user.emailVerified,
    };
  }

  private async sendVerificationEmail(email: string, userId: string): Promise<void> {
    try {
      await this.sendEmailVerificationInteractor.execute({ email });
    } catch (error) {
      this.logger.error({
        event: 'email_verification_send_failed_after_register',
        userId,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  private normalizeEmail(email: string): string {
    const normalized = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new BadRequestException('email must be valid');
    }

    return normalized;
  }

  private normalizeDisplayName(firstName: string, lastName: string): string {
    const normalizedFirstName = firstName.trim().replace(/\s+/g, ' ');
    const normalizedLastName = lastName.trim().replace(/\s+/g, ' ');
    const displayName = `${normalizedFirstName} ${normalizedLastName}`.trim();

    if (!displayName) {
      throw new BadRequestException('name is required');
    }

    return displayName;
  }

  private validatePassword(password: string): void {
    if (password.length < 8 || password.length > 72) {
      throw new BadRequestException(
        'password must contain between 8 and 72 characters',
      );
    }
  }
}
