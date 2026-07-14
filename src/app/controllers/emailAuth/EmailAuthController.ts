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
import { RegisterWithEmailInteractor } from '../../../core/interactors/emailAuth/RegisterWithEmailInteractor';
import { SignInWithEmailInteractor } from '../../../core/interactors/emailAuth/SignInWithEmailInteractor';
import {
  EmailAuthResponseDto,
  mapEmailAuthResponse,
} from '../../dtos/emailAuth/EmailAuthResponseDto';
import { RegisterWithEmailDto } from '../../dtos/emailAuth/RegisterWithEmailDto';
import { SignInWithEmailDto } from '../../dtos/emailAuth/SignInWithEmailDto';

@ApiTags('emailAuth')
@Controller('auth/email')
export class EmailAuthController {
  constructor(
    private readonly registerWithEmailInteractor: RegisterWithEmailInteractor,
    private readonly signInWithEmailInteractor: SignInWithEmailInteractor,
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
}
