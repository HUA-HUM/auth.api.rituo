export type UserStatus = 'active' | 'disabled';

export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

export interface UpdateUserProfileData {
  displayName?: string | null;
}
