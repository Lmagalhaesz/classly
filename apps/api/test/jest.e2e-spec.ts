import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module'; // Importa seu módulo principal

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule], // Usa a aplicação REAL!
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe()); // igual a produção
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/login (POST) - deve falhar se credencial errada', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'fake@email.com', password: 'errada' });
    
    expect(response.status).toBe(401); // Unauthorized
    expect(response.body.message).toMatch(/credenciais/i);
  });

  // Você pode criar outros testes: sucesso, refresh, register, etc.
});
