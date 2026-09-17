import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_PROVIDER } from './redis.constants';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const host = config.get<string>('redis.host', 'localhost');
        const port = config.get<number>('redis.port', 6379);
        const password = config.get<string | undefined>('redis.password');
        const redisOptions: Record<string, unknown> = { host, port, maxRetriesPerRequest: 3 };
        if (password) {
          redisOptions.password = password;
        }
        return new Redis(redisOptions);
      },
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
