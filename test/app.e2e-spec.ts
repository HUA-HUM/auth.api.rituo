import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppController } from '../src/app/controllers/app.controller';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let controller: AppController;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    app = moduleFixture.createNestApplication();
    controller = moduleFixture.get(AppController);
    await app.init();
  });

  it('boots the application module', () => {
    expect(controller.getRoot()).toBe('rituo-auth-api');
  });

  afterEach(async () => {
    await app.close();
  });
});
