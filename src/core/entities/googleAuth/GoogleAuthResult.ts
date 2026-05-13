import { User } from '../users/User';

export interface GoogleAuthResult {
  accessToken: string;
  refreshToken: string;
  user: User;
}
