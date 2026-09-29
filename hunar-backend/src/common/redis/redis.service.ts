import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { REDIS_PROVIDER } from './redis.constants';

export interface RedisClient {
  set(key: string, value: string, mode?: string, ttlSeconds?: number, nx?: string): Promise<'OK' | null>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, ttlSeconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  ping(): Promise<string>;
  disconnect(): void;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject(REDIS_PROVIDER) private readonly client: RedisClient) {}

  getClient(): RedisClient {
    return this.client;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  onModuleDestroy(): void {
    this.client.disconnect();
  }
}
