import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import {
  AuthIdentity,
  AuthProvider,
  CreateAuthIdentityData,
} from '../../../../core/entities/authIdentities/AuthIdentity';
import { IAuthIdentitiesRepository } from '../../../../core/adapters/repositories/authIdentities/IAuthIdentitiesRepository';

interface AuthIdentityRow {
  id: string;
  userId: string;
  provider: AuthProvider;
  providerSubject: string;
  providerEmail: string | null;
  providerEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SQLAuthIdentitiesRepository implements IAuthIdentitiesRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async findByProviderSubject(
    provider: AuthProvider,
    providerSubject: string,
  ): Promise<AuthIdentity | null> {
    const rows = await this.queryRows<AuthIdentityRow>(
      `
        select
          id,
          user_id as "userId",
          provider,
          provider_subject as "providerSubject",
          provider_email as "providerEmail",
          provider_email_verified as "providerEmailVerified",
          created_at as "createdAt",
          updated_at as "updatedAt"
        from auth_identities
        where provider = $1
          and provider_subject = $2
        limit 1
      `,
      [provider, providerSubject],
    );

    return rows[0] ? this.mapRowToAuthIdentity(rows[0]) : null;
  }

  async create(data: CreateAuthIdentityData): Promise<AuthIdentity> {
    const rows = await this.queryRows<AuthIdentityRow>(
      `
        insert into auth_identities (
          user_id,
          provider,
          provider_subject,
          provider_email,
          provider_email_verified
        )
        values ($1, $2, $3, $4, $5)
        returning
          id,
          user_id as "userId",
          provider,
          provider_subject as "providerSubject",
          provider_email as "providerEmail",
          provider_email_verified as "providerEmailVerified",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `,
      [
        data.userId,
        data.provider,
        data.providerSubject,
        data.providerEmail,
        data.providerEmailVerified,
      ],
    );

    return this.mapRowToAuthIdentity(rows[0]);
  }

  private mapRowToAuthIdentity(row: AuthIdentityRow): AuthIdentity {
    return {
      id: row.id,
      userId: row.userId,
      provider: row.provider,
      providerSubject: row.providerSubject,
      providerEmail: row.providerEmail,
      providerEmailVerified: row.providerEmailVerified,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  private async queryRows<T>(sql: string, params: unknown[]): Promise<T[]> {
    const result: unknown = await this.entityManager.query(sql, params);
    return result as T[];
  }
}
