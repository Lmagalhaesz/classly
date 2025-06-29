import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

describe('VideoController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/videos (GET)', () => {
    return request(app.getHttpServer())
      .get('/videos')
      .set('Authorization', 'Bearer <seu_access_token>')
      .expect(200);
  });

  // Adicione outros testes para POST, PUT, DELETE, etc.
  
  afterAll(async () => {
    await app.close();
  });
});