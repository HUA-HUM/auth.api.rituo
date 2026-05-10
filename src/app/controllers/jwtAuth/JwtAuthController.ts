import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RefreshTokenInteractor } from '../../../core/interactors/jwtAuth/RefreshTokenInteractor';
import { LogoutInteractor } from '../../../core/interactors/jwtAuth/LogoutInteractor';
import { GetCurrentUserInteractor } from '../../../core/interactors/jwtAuth/GetCurrentUserInteractor';
import { RefreshTokenDto } from '../../dtos/jwtAuth/RefreshTokenDto';
import { JwtAuthGuard } from '../../services/jwtAuth/guards/JwtAuthGuard';
import type { AuthenticatedRequest } from '../../services/jwtAuth/guards/JwtAuthGuard';

@ApiTags('jwtAuth')
@Controller('auth')
export class JwtAuthController {
  constructor(
    private readonly refreshTokenInteractor: RefreshTokenInteractor,
    private readonly logoutInteractor: LogoutInteractor,
    private readonly getCurrentUserInteractor: GetCurrentUserInteractor,
  ) {}

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Rotates refresh token and returns a new access token.',
  })
  refresh(
    @Body() body: RefreshTokenDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.refreshTokenInteractor.execute(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() body: RefreshTokenDto): Promise<void> {
    await this.logoutInteractor.execute(body.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Returns the authenticated rituo user.',
  })
  async me(@Req() request: AuthenticatedRequest): Promise<{
    id: string;
    email: string | null;
    displayName: string | null;
    emailVerified: boolean;
    status: string;
  }> {
    const user = await this.getCurrentUserInteractor.execute(
      request.auth.userId,
    );

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      status: user.status,
    };
  }
}
