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
import {
  ClientPlatform,
  normalizeClientPlatform,
  normalizeOptionalClientText,
} from '../../entities/refreshSessions/ClientMetadata';

export interface RegisterWithEmailCommand {
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  password: string;
  deviceId: string;
  deviceLabel?: string | null;
  platform?: ClientPlatform | null;
  appVersion?: string | null;
  appBuild?: string | null;
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
  ) {}

  async execute(
    command: RegisterWithEmailCommand,
  ): Promise<RegisterWithEmailResult> {
    const email = this.normalizeEmail(command.email);
    const displayName = this.normalizeDisplayName(
      command.firstName,
      command.lastName,
    );
    const dateOfBirth = this.validateDateOfBirth(command.dateOfBirth);
    this.validatePassword(command.password);
    const platform = normalizeClientPlatform(command.platform);

    const [existingUser, existingCredential] = await Promise.all([
      this.usersRepository.findByEmail(email),
      this.emailPasswordCredentialsRepository.findByEmail(email),
    ]);

    if (existingUser || existingCredential) {
      throw new ConflictException('email is already registered');
    }

    const user: User = await this.usersRepository.create({
      email,
      displayName,
      dateOfBirth,
      emailVerified: true,
    });

    await this.emailPasswordCredentialsRepository.create({
      userId: user.id,
      email,
      passwordHash: await this.tokenHasher.hash(command.password),
    });

    this.logger.log({
      event: 'user_registered',
      provider: 'email',
      userId: user.id,
      deviceId: command.deviceId,
      platform,
      appVersion: normalizeOptionalClientText(command.appVersion),
      appBuild: normalizeOptionalClientText(command.appBuild),
    });

    return {
      user,
      emailVerificationRequired: !user.emailVerified,
    };
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

  private validateDateOfBirth(value: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (!match) {
      throw new BadRequestException('dateOfBirth must use YYYY-MM-DD format');
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const birthDate = new Date(Date.UTC(year, month - 1, day));

    if (
      birthDate.getUTCFullYear() !== year ||
      birthDate.getUTCMonth() !== month - 1 ||
      birthDate.getUTCDate() !== day
    ) {
      throw new BadRequestException('dateOfBirth must be a valid date');
    }

    const today = new Date();
    let age = today.getUTCFullYear() - year;
    const birthdayHasPassed =
      today.getUTCMonth() > month - 1 ||
      (today.getUTCMonth() === month - 1 && today.getUTCDate() >= day);

    if (!birthdayHasPassed) {
      age -= 1;
    }

    if (age < 16) {
      throw new BadRequestException(
        'user must be at least 16 years old to register',
      );
    }

    return value;
  }
}
