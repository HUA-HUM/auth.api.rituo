import {
  CreateRefreshSessionData,
  RefreshSession,
} from '../../../entities/refreshSessions/RefreshSession';

export const REFRESH_SESSIONS_REPOSITORY = Symbol(
  'REFRESH_SESSIONS_REPOSITORY',
);

export interface IRefreshSessionsRepository {
  create(data: CreateRefreshSessionData): Promise<RefreshSession>;
  findById(id: string): Promise<RefreshSession | null>;
  updateTokenHash(sessionId: string, tokenHash: string): Promise<void>;
  revoke(sessionId: string): Promise<void>;
  revokeActiveSessionsForUser(userId: string): Promise<void>;
  revokeActiveSessionsForUserExcept(userId: string, sessionId: string): Promise<void>;
}
