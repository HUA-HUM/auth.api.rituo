import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SignInWithAppleInteractor } from '../../../core/interactors/appleAuth/SignInWithAppleInteractor';
import { SignInWithAppleDto } from '../../dtos/appleAuth/SignInWithAppleDto';
import {
  AppleAuthResponseDto,
  mapAppleAuthResponse,
} from '../../dtos/appleAuth/AppleAuthResponseDto';

@ApiTags('appleAuth')
@Controller('auth')
export class AppleAuthController {
  constructor(
    private readonly signInWithAppleInteractor: SignInWithAppleInteractor,
  ) {}

  @Post('apple')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Returns rituo access and refresh tokens for a valid Apple identity.',
  })
  async signInWithApple(
    @Body() body: SignInWithAppleDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<AppleAuthResponseDto> {
    const result = await this.signInWithAppleInteractor.execute({
      identityToken: body.identityToken,
      authorizationCode: body.authorizationCode,
      deviceId: body.deviceId,
      deviceLabel: body.deviceLabel,
      displayName: body.displayName,
      userAgent: userAgent ?? null,
      ipAddress,
    });

    return mapAppleAuthResponse(result);
  }
}
