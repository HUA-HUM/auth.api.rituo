import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { ITokenHasher } from '../../../core/adapters/services/jwtAuth/ITokenHasher';

@Injectable()
export class BcryptTokenHasher implements ITokenHasher {
  hash(token: string): Promise<string> {
    return bcrypt.hash(token, 12);
  }

  compare(token: string, hash: string): Promise<boolean> {
    return bcrypt.compare(token, hash);
  }
}
