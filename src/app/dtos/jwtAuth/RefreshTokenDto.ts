import { ApiProperty } from '@nestjs/swagger';
import { IsJWT } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'rituo refresh token returned by auth-api.',
  })
  @IsJWT()
  refreshToken: string;
}
