import { MemoryRedisService } from './memory-redis.service';

describe('MemoryRedisService', () => {
  let redis: MemoryRedisService;

  beforeEach(() => {
    redis = new MemoryRedisService();
  });

  afterEach(() => {
    redis.disconnect();
  });

  it('returns 0-ish semantics for missing keys', async () => {
    expect(await redis.get('missing')).toBeNull();
    expect(await redis.exists('missing')).toBe(0);
    expect(await redis.incr('missing')).toBe(1);
    expect(await redis.get('missing')).toBe('1');
  });

  it('keeps the TTL across INCR like real Redis', async () => {
    const key = 'rate:login:03000000000';
    expect(await redis.incr(key)).toBe(1);
    await redis.expire(key, 300);

    const ttlAfterExpire = await redis.ttl(key);
    expect(ttlAfterExpire).toBeGreaterThan(290);
    expect(ttlAfterExpire).toBeLessThanOrEqual(300);

    for (let i = 2; i <= 5; i++) {
      expect(await redis.incr(key)).toBe(i);
    }

    expect(await redis.get(key)).toBe('5');
    expect(await redis.ttl(key)).toBeGreaterThan(0);
  });

  it('resets the counter once the window expires', async () => {
    const key = 'rate:login:03000000001';
    await redis.incr(key);
    await redis.expire(key, -1);

    expect(await redis.get(key)).toBeNull();
    expect(await redis.exists(key)).toBe(0);
    expect(await redis.incr(key)).toBe(1);
  });

  it('applies NX semantics only when the key is live', async () => {
    const key = 'otp:cooldown:03000000002';
    expect(await redis.set(key, '1', 'EX', 60, 'NX')).toBe('OK');
    expect(await redis.set(key, '2', 'EX', 60, 'NX')).toBeNull();

    await redis.expire(key, -1);
    expect(await redis.set(key, '3', 'EX', 60, 'NX')).toBe('OK');
    expect(await redis.get(key)).toBe('3');
  });

  it('stores plain values with no TTL when ttlSeconds is omitted', async () => {
    expect(await redis.set('plain', 'value')).toBe('OK');
    expect(await redis.ttl('plain')).toBe(-1);
    expect(await redis.del('plain')).toBe(1);
    expect(await redis.del('plain')).toBe(0);
  });
});
