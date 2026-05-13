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
import { SignInWithGoogleInteractor } from '../../../core/interactors/googleAuth/SignInWithGoogleInteractor';
import {
  GoogleAuthResponseDto,
  mapGoogleAuthResponse,
} from '../../dtos/googleAuth/GoogleAuthResponseDto';
import { SignInWithGoogleDto } from '../../dtos/googleAuth/SignInWithGoogleDto';

@ApiTags('googleAuth')
@Controller('auth')
export class GoogleAuthController {
  constructor(
    private readonly signInWithGoogleInteractor: SignInWithGoogleInteractor,
  ) {}

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Returns rituo access and refresh tokens for a valid Google identity.',
  })
  async signInWithGoogle(
    @Body() body: SignInWithGoogleDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<GoogleAuthResponseDto> {
    const result = await this.signInWithGoogleInteractor.execute({
      identityToken: body.identityToken,
      deviceId: body.deviceId,
      deviceLabel: body.deviceLabel,
      userAgent: userAgent ?? null,
      ipAddress,
    });

    return mapGoogleAuthResponse(result);
  }
}
