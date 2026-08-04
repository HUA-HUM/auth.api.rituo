import { ClientPlatform } from '../../../entities/refreshSessions/ClientMetadata';

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface AccessTokenPayload {
  sub: string;
  sessionId: string;
  deviceId?: string;
  platform?: ClientPlatform;
}

export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
  typ: 'refresh';
  deviceId?: string;
  platform?: ClientPlatform;
}

export interface ITokenService {
  signAccessToken(payload: AccessTokenPayload): Promise<string>;
  signRefreshToken(payload: RefreshTokenPayload): Promise<string>;
  verifyAccessToken(token: string): Promise<AccessTokenPayload>;
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
}
