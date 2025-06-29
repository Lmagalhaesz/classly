import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { Logger } from 'nestjs-pino'; // Pino Logger
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // necessário para o logger capturar erros antes do boot completo
  });

  app.useLogger(app.get(Logger)); // substitui logger global do Nest por Pino

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get('security.corsOrigin'),
  });

  const config = new DocumentBuilder()
    .setTitle('Linfox Swagger')
    .setDescription('The future of education systems.')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, config));

  const port = configService.get<number>('port') || 3000;
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', true);

  app.use(cookieParser());

  await app.listen(port);
}
bootstrap();
