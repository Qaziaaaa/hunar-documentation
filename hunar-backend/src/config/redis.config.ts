export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

export default () => {
  const redisConfig: RedisConfig = {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  };
  return redisConfig;
};
