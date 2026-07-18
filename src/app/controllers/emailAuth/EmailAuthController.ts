import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
} from '@nestjs/common';
import { ApiConflictResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ForgotPasswordInteractor } from '../../../core/interactors/emailAuth/ForgotPasswordInteractor';
import { RegisterWithEmailInteractor } from '../../../core/interactors/emailAuth/RegisterWithEmailInteractor';
import { ResetPasswordInteractor } from '../../../core/interactors/emailAuth/ResetPasswordInteractor';
import { SendEmailVerificationInteractor } from '../../../core/interactors/emailAuth/SendEmailVerificationInteractor';
import { SignInWithEmailInteractor } from '../../../core/interactors/emailAuth/SignInWithEmailInteractor';
import { VerifyEmailInteractor } from '../../../core/interactors/emailAuth/VerifyEmailInteractor';
import {
  EmailAuthResponseDto,
  mapEmailAuthResponse,
} from '../../dtos/emailAuth/EmailAuthResponseDto';
import { RegisterWithEmailDto } from '../../dtos/emailAuth/RegisterWithEmailDto';
import { ForgotPasswordDto } from '../../dtos/emailAuth/ForgotPasswordDto';
import { ResendEmailVerificationDto } from '../../dtos/emailAuth/ResendEmailVerificationDto';
import { ResetPasswordDto } from '../../dtos/emailAuth/ResetPasswordDto';
import { SignInWithEmailDto } from '../../dtos/emailAuth/SignInWithEmailDto';
import { VerifyEmailDto } from '../../dtos/emailAuth/VerifyEmailDto';

@ApiTags('emailAuth')
@Controller('auth/email')
export class EmailAuthController {
  constructor(
    private readonly registerWithEmailInteractor: RegisterWithEmailInteractor,
    private readonly signInWithEmailInteractor: SignInWithEmailInteractor,
    private readonly forgotPasswordInteractor: ForgotPasswordInteractor,
    private readonly resetPasswordInteractor: ResetPasswordInteractor,
    private readonly sendEmailVerificationInteractor: SendEmailVerificationInteractor,
    private readonly verifyEmailInteractor: VerifyEmailInteractor,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Creates a rituo user with email/password and returns access and refresh tokens.',
  })
  @ApiConflictResponse({ description: 'Email is already registered.' })
  async register(
    @Body() body: RegisterWithEmailDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<EmailAuthResponseDto> {
    if (body.password !== body.passwordConfirmation) {
      throw new BadRequestException('password confirmation does not match');
    }

    const result = await this.registerWithEmailInteractor.execute({
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      password: body.password,
      deviceId: body.deviceId,
      deviceLabel: body.deviceLabel,
      userAgent: userAgent ?? null,
      ipAddress,
    });

    return mapEmailAuthResponse(result);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Returns rituo access and refresh tokens for valid email/password credentials.',
  })
  async login(
    @Body() body: SignInWithEmailDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<EmailAuthResponseDto> {
    const result = await this.signInWithEmailInteractor.execute({
      email: body.email,
      password: body.password,
      deviceId: body.deviceId,
      deviceLabel: body.deviceLabel,
      userAgent: userAgent ?? null,
      ipAddress,
    });

    return mapEmailAuthResponse(result);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Sends a password reset email when the account exists. Always returns OK.',
  })
  async forgotPassword(@Body() body: ForgotPasswordDto): Promise<{ ok: true }> {
    await this.forgotPasswordInteractor.execute({ email: body.email });
    return { ok: true };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() body: ResetPasswordDto): Promise<void> {
    await this.resetPasswordInteractor.execute({
      token: body.token,
      newPassword: body.newPassword,
      newPasswordConfirmation: body.newPasswordConfirmation,
    });
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Sends an email verification link when the account exists and is not verified. Always returns OK.',
  })
  async resendVerification(
    @Body() body: ResendEmailVerificationDto,
  ): Promise<{ ok: true }> {
    await this.sendEmailVerificationInteractor.execute({ email: body.email });
    return { ok: true };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Marks an email account as verified when the token is valid.',
  })
  async verifyEmail(@Body() body: VerifyEmailDto): Promise<{
    id: string;
    email: string | null;
    displayName: string | null;
    emailVerified: boolean;
  }> {
    const user = await this.verifyEmailInteractor.execute({ token: body.token });

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
    };
  }
}
