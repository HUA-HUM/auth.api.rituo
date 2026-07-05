import { Inject, Injectable } from '@nestjs/common';
import { USERS_REPOSITORY } from '../../adapters/repositories/users/IUsersRepository';
import type { IUsersRepository } from '../../adapters/repositories/users/IUsersRepository';

@Injectable()
export class DeleteAccountInteractor {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    await this.usersRepository.deleteAccountData(userId);
  }
}
