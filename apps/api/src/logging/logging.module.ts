import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { loggerOptions } from './logging.config';

@Module({
  imports: [WinstonModule.forRoot(loggerOptions)],
  exports: [WinstonModule],
})
export class LoggingModule {}
