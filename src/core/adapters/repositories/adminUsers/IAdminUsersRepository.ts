export const ADMIN_USERS_REPOSITORY = Symbol('ADMIN_USERS_REPOSITORY');

export interface IAdminUsersRepository {
  isAdmin(userId: string): Promise<boolean>;
}
