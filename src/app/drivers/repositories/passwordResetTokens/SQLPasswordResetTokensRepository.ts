import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import {
  CreatePasswordResetTokenData,
  PasswordResetToken,
} from '../../../../core/entities/passwordResetTokens/PasswordResetToken';
import { IPasswordResetTokensRepository } from '../../../../core/adapters/repositories/passwordResetTokens/IPasswordResetTokensRepository';

interface PasswordResetTokenRow {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class SQLPasswordResetTokensRepository
  implements IPasswordResetTokensRepository
{
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async create(data: CreatePasswordResetTokenData): Promise<PasswordResetToken> {
    const rows = await this.queryRows<PasswordResetTokenRow>(
      `
        insert into password_reset_tokens (
          user_id,
          token_hash,
          expires_at
        )
        values ($1, $2, $3)
        returning
          id::text as "id",
          user_id::text as "userId",
          token_hash as "tokenHash",
          expires_at as "expiresAt",
          used_at as "usedAt",
          created_at as "createdAt"
      `,
      [data.userId, data.tokenHash, data.expiresAt],
    );

    return this.mapRowToToken(rows[0]);
  }

  async useValidToken(tokenHash: string): Promise<PasswordResetToken | null> {
    const rows = await this.queryRows<PasswordResetTokenRow>(
      `
        update password_reset_tokens
        set used_at = now()
        where id = (
          select id
          from password_reset_tokens
          where token_hash = $1
            and used_at is null
            and expires_at > now()
          order by created_at desc
          limit 1
        )
        returning
          id::text as "id",
          user_id::text as "userId",
          token_hash as "tokenHash",
          expires_at as "expiresAt",
          used_at as "usedAt",
          created_at as "createdAt"
      `,
      [tokenHash],
    );

    return rows[0] ? this.mapRowToToken(rows[0]) : null;
  }

  private mapRowToToken(row: PasswordResetTokenRow): PasswordResetToken {
    return {
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      expiresAt: new Date(row.expiresAt),
      usedAt: row.usedAt ? new Date(row.usedAt) : null,
      createdAt: new Date(row.createdAt),
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
