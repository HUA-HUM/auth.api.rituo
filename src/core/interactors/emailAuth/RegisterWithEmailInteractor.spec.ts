import { BadRequestException } from '@nestjs/common';
import { RegisterWithEmailInteractor } from './RegisterWithEmailInteractor';

describe('RegisterWithEmailInteractor', () => {
  const usersRepository = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };
  const credentialsRepository = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };
  const tokenHasher = { hash: jest.fn() };
  const sendEmailVerificationInteractor = { execute: jest.fn() };
  const interactor = new RegisterWithEmailInteractor(
    usersRepository as never,
    credentialsRepository as never,
    tokenHasher as never,
    sendEmailVerificationInteractor as never,
  );

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-08T12:00:00.000Z'));
    jest.clearAllMocks();
    usersRepository.findByEmail.mockResolvedValue(null);
    credentialsRepository.findByEmail.mockResolvedValue(null);
    tokenHasher.hash.mockResolvedValue('password-hash');
    credentialsRepository.create.mockResolvedValue(undefined);
    sendEmailVerificationInteractor.execute.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('registers a user who turns 16 today and requires email verification', async () => {
    usersRepository.create.mockImplementation(async (data) => ({
      id: 'user-id',
      email: data.email,
      displayName: data.displayName,
      dateOfBirth: data.dateOfBirth,
      emailVerified: data.emailVerified,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await interactor.execute({
      email: 'person@example.com',
      firstName: 'Rituo',
      lastName: 'User',
      dateOfBirth: '2010-08-08',
      password: 'password123',
      deviceId: 'iphone-id',
    });

    expect(usersRepository.create).toHaveBeenCalledWith({
      email: 'person@example.com',
      displayName: 'Rituo User',
      dateOfBirth: '2010-08-08',
      emailVerified: false,
    });
    expect(sendEmailVerificationInteractor.execute).toHaveBeenCalledWith({
      email: 'person@example.com',
    });
    expect(result.emailVerificationRequired).toBe(true);
  });

  it('blocks a user who turns 16 tomorrow before creating any data', async () => {
    await expect(
      interactor.execute({
        email: 'minor@example.com',
        firstName: 'Rituo',
        lastName: 'Minor',
        dateOfBirth: '2010-08-09',
        password: 'password123',
        deviceId: 'iphone-id',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(usersRepository.findByEmail).not.toHaveBeenCalled();
    expect(usersRepository.create).not.toHaveBeenCalled();
    expect(credentialsRepository.create).not.toHaveBeenCalled();
    expect(sendEmailVerificationInteractor.execute).not.toHaveBeenCalled();
  });
});
