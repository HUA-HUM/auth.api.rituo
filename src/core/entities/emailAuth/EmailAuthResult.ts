import { User } from '../users/User';

export interface EmailAuthResult {
  accessToken: string;
  refreshToken: string;
  user: User;
}
