import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global() // Torna esse módulo global para que não precise importá-lo em cada módulo
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
