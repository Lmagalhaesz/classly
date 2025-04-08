import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { WinstonModule } from 'nest-winston';
import { loggerOptions } from './logging/logging.config';
import { ConfigService } from '@nestjs/config';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(loggerOptions),
  });
  const configService = app.get(ConfigService);

  //Configuração CORS
  app.enableCors({
    origin: configService.get('security.corsOrigin'),
  });

  const config = new DocumentBuilder()
    .setTitle('Linfox Swagger')
    .setDescription('The future of education systems.')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  const port = configService.get<number>('port') || 3000;
  await app.listen(port);
}
bootstrap();
