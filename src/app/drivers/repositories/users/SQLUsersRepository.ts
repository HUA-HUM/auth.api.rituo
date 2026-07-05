import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import {
  CreateUserData,
  UpdateUserProfileData,
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
          id::text as "id",
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

  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();

    const rows = await this.queryRows<UserRow>(
      `
        select
          id::text as "id",
          email,
          display_name as "displayName",
          email_verified as "emailVerified",
          status,
          created_at as "createdAt",
          updated_at as "updatedAt"
        from users
        where lower(email) = $1
        order by created_at asc
        limit 1
      `,
      [normalizedEmail],
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
          id::text as "id",
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

  async updateProfile(
    userId: string,
    data: UpdateUserProfileData,
  ): Promise<User> {
    const rows = await this.queryRows<UserRow>(
      `
        update users
        set
          display_name = coalesce($2, display_name),
          updated_at = now()
        where id = $1
        returning
          id::text as "id",
          email,
          display_name as "displayName",
          email_verified as "emailVerified",
          status,
          created_at as "createdAt",
          updated_at as "updatedAt"
      `,
      [userId, data.displayName ?? null],
    );

    return this.mapRowToUser(rows[0]);
  }

  async deleteAccountData(userId: string): Promise<boolean> {
    return this.entityManager.transaction(async (manager) => {
      await manager.query(
        'select pg_advisory_xact_lock(hashtextextended($1, 0))',
        [userId],
      );

      const tagRows = (await manager.query(
        'select tag_id as "tagId" from nfc_tag_claims where user_id = $1',
        [userId],
      )) as Array<{ tagId: string }>;

      await manager.query('delete from nfc_tag_claims where user_id = $1', [
        userId,
      ]);
      await manager.query('delete from ritual_sessions where user_id = $1', [
        userId,
      ]);
      await manager.query('delete from mode_sessions where user_id = $1', [
        userId,
      ]);
      await manager.query(
        'delete from ritual_blocked_items where ritual_id in (select id from rituals where user_id = $1)',
        [userId],
      );
      await manager.query(
        'delete from mode_blocked_items where mode_id in (select id from modes where user_id = $1)',
        [userId],
      );
      await manager.query('delete from rituals where user_id = $1', [userId]);
      await manager.query('delete from modes where user_id = $1', [userId]);
      await manager.query(
        'delete from idempotency_operations where user_id = $1',
        [userId],
      );
      await manager.query('delete from refresh_sessions where user_id = $1', [
        userId,
      ]);
      await manager.query('delete from auth_identities where user_id = $1', [
        userId,
      ]);

      for (const { tagId } of tagRows) {
        await manager.query(
          'delete from nfc_tags where id = $1 and not exists (select 1 from nfc_tag_claims where tag_id = $1)',
          [tagId],
        );
      }

      const deletedRows = (await manager.query(
        'delete from users where id = $1 returning id',
        [userId],
      )) as Array<{ id: string }>;

      return deletedRows.length > 0;
    });
  }

  private mapRowToUser(row: UserRow | undefined): User {
    if (!row?.id) {
      throw new InternalServerErrorException(
        'User row was returned without id',
      );
    }

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
