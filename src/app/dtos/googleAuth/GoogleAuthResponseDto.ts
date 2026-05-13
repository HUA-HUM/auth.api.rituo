import { User } from '../../../core/entities/users/User';

export interface GoogleAuthResponseDto {
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

export function mapGoogleAuthResponse(input: {
  accessToken: string;
  refreshToken: string;
  user: User;
}): GoogleAuthResponseDto {
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
