import { CreateUserData, User } from '../../../entities/users/User';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface IUsersRepository {
  findById(id: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
}
