import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { IAdminUsersRepository } from '../../../../core/adapters/repositories/adminUsers/IAdminUsersRepository';

@Injectable()
export class SQLAdminUsersRepository implements IAdminUsersRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async isAdmin(userId: string): Promise<boolean> {
    const result: unknown = await this.entityManager.query(
      `select 1 from admin_users where user_id = $1 limit 1`,
      [userId],
    );

    const rows = this.rowsFromResult<{ '?column?': number }>(result);
    return rows.length > 0;
  }

  private rowsFromResult<T>(result: unknown): T[] {
    if (
      Array.isArray(result) &&
      result.length === 2 &&
      Array.isArray(result[0]) &&
      typeof result[1] === 'number'
    ) {
      return result[0] as T[];
    }

    return result as T[];
  }
}
