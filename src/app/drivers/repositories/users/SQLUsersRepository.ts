import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import {
  CreateUserData,
  User,
  UserStatus,
} from '../../../../core/entities/users/User';
import { IUsersRepository } from '../../../../core/adapters/repositories/users/IUsersRepository';

interface UserRow {
  id: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SQLUsersRepository implements IUsersRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async findById(id: string): Promise<User | null> {
    const rows = await this.queryRows<UserRow>(
      `
        select
          id,
          email,
          display_name as "displayName",
          email_verified as "emailVerified",
          status,
          created_at as "createdAt",
          updated_at as "updatedAt"
        from users
        where id = $1
        limit 1
      `,
      [id],
    );

    return rows[0] ? this.mapRowToUser(rows[0]) : null;
  }

  async create(data: CreateUserData): Promise<User> {
    const rows = await this.queryRows<UserRow>(
      `
        insert into users (
          email,
          display_name,
          email_verified
        )
        values ($1, $2, $3)
        returning
          id,
          email,
          display_name as "displayName",
          email_verified as "emailVerified",
          status,
          created_at as "createdAt",
          updated_at as "updatedAt"
      `,
      [data.email, data.displayName, data.emailVerified],
    );

    return this.mapRowToUser(rows[0]);
  }

  private mapRowToUser(row: UserRow): User {
    return {
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      emailVerified: row.emailVerified,
      status: row.status,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  private async queryRows<T>(sql: string, params: unknown[]): Promise<T[]> {
    const result: unknown = await this.entityManager.query(sql, params);
    return result as T[];
  }
}
