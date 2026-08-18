import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ example: 'arturo@rituo.io' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password: string;
}
