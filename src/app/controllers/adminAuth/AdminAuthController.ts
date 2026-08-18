import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { VerifyAdminCredentialsInteractor } from '../../../core/interactors/adminAuth/VerifyAdminCredentialsInteractor';
import { AdminLoginDto } from '../../dtos/adminAuth/AdminLoginDto';

@ApiTags('adminAuth')
@Controller('auth/admin')
export class AdminAuthController {
  constructor(
    private readonly verifyAdminCredentialsInteractor: VerifyAdminCredentialsInteractor,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Verifies rituo email/password credentials plus admin_users membership. Does not create a session — the caller (web-rituo-front) mints its own admin panel session.',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or the account is not an admin.',
  })
  async login(@Body() body: AdminLoginDto): Promise<{
    id: string;
    email: string | null;
    displayName: string | null;
  }> {
    return this.verifyAdminCredentialsInteractor.execute({
      email: body.email,
      password: body.password,
    });
  }
}
