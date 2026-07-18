import {
  CreateUserData,
  UpdateUserProfileData,
  User,
} from '../../../entities/users/User';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface IUsersRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  updateProfile(userId: string, data: UpdateUserProfileData): Promise<User>;
  markEmailVerified(userId: string): Promise<User>;
  deleteAccountData(userId: string): Promise<boolean>;
}
