import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterWithEmailDto {
  @ApiProperty({ example: 'arturo@rituo.io' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: 'Arturo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName: string;

  @ApiProperty({ example: 'Gutierrez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName: string;

  @ApiProperty({ minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiProperty({ minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  passwordConfirmation: string;

  @ApiProperty({
    description: 'Stable app-generated identifier for the current device.',
    example: 'iphone-arturo-001',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  deviceId: string;

  @ApiPropertyOptional({
    description: 'Human-readable device label.',
    example: 'iPhone de Arturo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  deviceLabel?: string;
}
