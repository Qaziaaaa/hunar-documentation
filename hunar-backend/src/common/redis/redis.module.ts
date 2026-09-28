import { Global, Module } from '@nestjs/common';
import { REDIS_PROVIDER } from './redis.constants';
import { RedisService } from './redis.service';
import { MemoryRedisService } from './memory-redis.service';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_PROVIDER,
      useClass: MemoryRedisService,
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
