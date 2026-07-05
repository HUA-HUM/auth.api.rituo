import { DeleteAccountInteractor } from './DeleteAccountInteractor';

describe('DeleteAccountInteractor', () => {
  const usersRepository = { deleteAccountData: jest.fn() };
  const interactor = new DeleteAccountInteractor(usersRepository as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes all account data for the authenticated user', async () => {
    usersRepository.deleteAccountData.mockResolvedValue(true);

    await expect(interactor.execute('user-id')).resolves.toBeUndefined();
    expect(usersRepository.deleteAccountData).toHaveBeenCalledWith('user-id');
  });

  it('is idempotent when the account no longer exists', async () => {
    usersRepository.deleteAccountData.mockResolvedValue(false);

    await expect(interactor.execute('missing-user')).resolves.toBeUndefined();
  });
});
