import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export class ResendEmailVerificationDto {
  @ApiProperty({ example: 'arturo@rituo.io' })
  @IsEmail()
  @MaxLength(254)
  email: string;
}
