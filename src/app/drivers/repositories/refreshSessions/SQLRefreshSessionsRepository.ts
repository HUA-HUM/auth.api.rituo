import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import {
  CreateRefreshSessionData,
  RefreshSession,
} from '../../../../core/entities/refreshSessions/RefreshSession';
import { IRefreshSessionsRepository } from '../../../../core/adapters/repositories/refreshSessions/IRefreshSessionsRepository';

interface RefreshSessionRow {
  id: string;
  userId: string;
  deviceId: string;
  deviceLabel: string | null;
  tokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SQLRefreshSessionsRepository implements IRefreshSessionsRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async create(data: CreateRefreshSessionData): Promise<RefreshSession> {
    const rows = await this.queryRows<RefreshSessionRow>(
      `
        insert into refresh_sessions (
          user_id,
          device_id,
          device_label,
          token_hash,
          user_agent,
          ip_address,
          expires_at
        )
        values ($1, $2, $3, $4, $5, $6, $7)
        returning
          id,
          user_id as "userId",
          device_id as "deviceId",
          device_label as "deviceLabel",
          token_hash as "tokenHash",
          user_agent as "userAgent",
          ip_address::text as "ipAddress",
          expires_at as "expiresAt",
          revoked_at as "revokedAt",
          last_used_at as "lastUsedAt",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `,
      [
        data.userId,
        data.deviceId,
        data.deviceLabel,
        data.tokenHash,
        data.userAgent,
        data.ipAddress,
        data.expiresAt,
      ],
    );

    return this.mapRowToRefreshSession(rows[0]);
  }

  async findById(id: string): Promise<RefreshSession | null> {
    const rows = await this.queryRows<RefreshSessionRow>(
      `
        select
          id,
          user_id as "userId",
          device_id as "deviceId",
          device_label as "deviceLabel",
          token_hash as "tokenHash",
          user_agent as "userAgent",
          ip_address::text as "ipAddress",
          expires_at as "expiresAt",
          revoked_at as "revokedAt",
          last_used_at as "lastUsedAt",
          created_at as "createdAt",
          updated_at as "updatedAt"
        from refresh_sessions
        where id = $1
        limit 1
      `,
      [id],
    );

    return rows[0] ? this.mapRowToRefreshSession(rows[0]) : null;
  }

  async updateTokenHash(sessionId: string, tokenHash: string): Promise<void> {
    await this.entityManager.query(
      `
        update refresh_sessions
        set
          token_hash = $2,
          last_used_at = now()
        where id = $1
      `,
      [sessionId, tokenHash],
    );
  }

  async revoke(sessionId: string): Promise<void> {
    await this.entityManager.query(
      `
        update refresh_sessions
        set revoked_at = now()
        where id = $1
          and revoked_at is null
      `,
      [sessionId],
    );
  }

  async revokeActiveSessionsForUserExcept(
    userId: string,
    sessionId: string,
  ): Promise<void> {
    await this.entityManager.query(
      `
        update refresh_sessions
        set revoked_at = now()
        where user_id = $1
          and id <> $2
          and revoked_at is null
      `,
      [userId, sessionId],
    );
  }

  private mapRowToRefreshSession(row: RefreshSessionRow): RefreshSession {
    return {
      id: row.id,
      userId: row.userId,
      deviceId: row.deviceId,
      deviceLabel: row.deviceLabel,
      tokenHash: row.tokenHash,
      userAgent: row.userAgent,
      ipAddress: row.ipAddress,
      expiresAt: new Date(row.expiresAt),
      revokedAt: row.revokedAt ? new Date(row.revokedAt) : null,
      lastUsedAt: row.lastUsedAt ? new Date(row.lastUsedAt) : null,
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
