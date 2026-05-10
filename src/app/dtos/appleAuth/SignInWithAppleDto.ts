import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsJWT,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SignInWithAppleDto {
  @ApiProperty({
    description: 'Apple identityToken returned by Sign in with Apple on iOS.',
  })
  @IsJWT()
  identityToken: string;

  @ApiProperty({
    description: 'Stable app-generated identifier for the current device.',
    example: 'iphone-arturo-001',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  deviceId: string;

  @ApiPropertyOptional({
    description: 'Optional Apple authorizationCode returned by iOS.',
  })
  @IsOptional()
  @IsString()
  authorizationCode?: string;

  @ApiPropertyOptional({
    description: 'Human-readable device label.',
    example: 'iPhone de Arturo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  deviceLabel?: string;
}
