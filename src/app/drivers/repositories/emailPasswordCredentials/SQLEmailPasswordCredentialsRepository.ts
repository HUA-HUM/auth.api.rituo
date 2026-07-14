import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import {
  CreateEmailPasswordCredentialData,
  EmailPasswordCredential,
} from '../../../../core/entities/emailPasswordCredentials/EmailPasswordCredential';
import { IEmailPasswordCredentialsRepository } from '../../../../core/adapters/repositories/emailPasswordCredentials/IEmailPasswordCredentialsRepository';

interface EmailPasswordCredentialRow {
  id: string;
  userId: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SQLEmailPasswordCredentialsRepository
  implements IEmailPasswordCredentialsRepository
{
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async create(
    data: CreateEmailPasswordCredentialData,
  ): Promise<EmailPasswordCredential> {
    const rows = await this.queryRows<EmailPasswordCredentialRow>(
      `
        insert into email_password_credentials (
          user_id,
          email,
          password_hash
        )
        values ($1, $2, $3)
        returning
          id::text as "id",
          user_id::text as "userId",
          email,
          password_hash as "passwordHash",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `,
      [data.userId, data.email.trim().toLowerCase(), data.passwordHash],
    );

    return this.mapRowToCredential(rows[0]);
  }

  async findByEmail(email: string): Promise<EmailPasswordCredential | null> {
    const rows = await this.queryRows<EmailPasswordCredentialRow>(
      `
        select
          id::text as "id",
          user_id::text as "userId",
          email,
          password_hash as "passwordHash",
          created_at as "createdAt",
          updated_at as "updatedAt"
        from email_password_credentials
        where lower(email) = $1
        limit 1
      `,
      [email.trim().toLowerCase()],
    );

    return rows[0] ? this.mapRowToCredential(rows[0]) : null;
  }

  private mapRowToCredential(
    row: EmailPasswordCredentialRow,
  ): EmailPasswordCredential {
    return {
      id: row.id,
      userId: row.userId,
      email: row.email,
      passwordHash: row.passwordHash,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  private async queryRows<T>(sql: string, params: unknown[]): Promise<T[]> {
    const result: unknown = await this.entityManager.query(sql, params);

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
