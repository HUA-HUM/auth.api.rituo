import { User } from '../../../core/entities/users/User';

export interface RegisterWithEmailResponseDto {
  ok: true;
  emailVerificationRequired: boolean;
  user: {
    id: string;
    email: string | null;
    displayName: string | null;
    emailVerified: boolean;
    status: string;
  };
}

export function mapRegisterWithEmailResponse(input: {
  user: User;
  emailVerificationRequired: boolean;
}): RegisterWithEmailResponseDto {
  return {
    ok: true,
    emailVerificationRequired: input.emailVerificationRequired,
    user: {
      id: input.user.id,
      email: input.user.email,
      displayName: input.user.displayName,
      emailVerified: input.user.emailVerified,
      status: input.user.status,
    },
  };
}
