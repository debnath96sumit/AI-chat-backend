import { Provider } from '@nestjs/common';
import { Redis } from 'ioredis';

export const REDIS_CONNECTION = 'REDIS_CONNECTION';

export const RedisProvider: Provider = {
  provide: REDIS_CONNECTION,
  useFactory: async () => {
    const redisUrl = process.env.REDIS_URL;

    const redis = redisUrl
      ? new Redis(redisUrl, {
          maxRetriesPerRequest: null,
        })
      : new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
          maxRetriesPerRequest: null,
        });

    redis.on('connect', () => console.log('✅ Connected to Redis'));
    redis.on('error', (err: any) => console.error('❌ Redis error:', err));

    return redis;
  },
};
