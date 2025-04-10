import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  public client: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.client = new Redis(redisUrl);
  }

  async onModuleInit() {
    this.client.on('error', (err) => console.error('Redis error:', err));
    console.log('Connected to Redis');
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
