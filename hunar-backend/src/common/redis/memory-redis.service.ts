import { Injectable, OnModuleDestroy } from '@nestjs/common';

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
export class MemoryRedisService implements RedisClient, OnModuleDestroy {
  private readonly store = new Map<string, { value: string; expiresAt?: number }>();

  async set(key: string, value: string, mode?: string, ttlSeconds?: number, nx?: string): Promise<'OK' | null> {
    if (nx === 'NX') {
      const existing = this.store.get(key);
      if (existing && (!existing.expiresAt || Date.now() <= existing.expiresAt)) {
        return null;
      }
    }
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return 0;
    }
    return 1;
  }

  async incr(key: string): Promise<number> {
    const current = parseInt(await this.get(key) || '0', 10);
    const next = current + 1;
    await this.set(key, next.toString());
    return next;
  }

  async expire(key: string, ttlSeconds: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + ttlSeconds * 1000;
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry || !entry.expiresAt) return -1;
    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  disconnect(): void {
    this.store.clear();
  }

  onModuleDestroy(): void {
    this.disconnect();
  }
}