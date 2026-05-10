export interface RefreshSession {
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

export interface CreateRefreshSessionData {
  userId: string;
  deviceId: string;
  deviceLabel: string | null;
  tokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
}
