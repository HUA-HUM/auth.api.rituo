import { User } from '../users/User';

export interface AppleAuthResult {
  accessToken: string;
  refreshToken: string;
  user: User;
}
