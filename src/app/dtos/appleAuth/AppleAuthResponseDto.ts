import { User } from '../../../core/entities/users/User';

export interface AppleAuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string | null;
    displayName: string | null;
    emailVerified: boolean;
    status: string;
  };
}

export function mapAppleAuthResponse(input: {
  accessToken: string;
  refreshToken: string;
  user: User;
}): AppleAuthResponseDto {
  return {
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
    user: {
      id: input.user.id,
      email: input.user.email,
      displayName: input.user.displayName,
      emailVerified: input.user.emailVerified,
      status: input.user.status,
    },
  };
}
