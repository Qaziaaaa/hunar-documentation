export interface JwtConfig {
  secret: string;
  accessTokenTtl: string;
  refreshTokenTtl: string;
  refreshTokenTtlSeconds: number;
}

export default () => {
  const jwtConfig: JwtConfig = {
    secret: process.env.JWT_SECRET ?? 'hunar-dev-secret-change-me',
    accessTokenTtl: process.env.JWT_ACCESS_TOKEN_TTL ?? '900s',
    refreshTokenTtl: process.env.JWT_REFRESH_TOKEN_TTL ?? '2592000s',
    refreshTokenTtlSeconds: parseInt(process.env.JWT_REFRESH_TOKEN_TTL ?? '2592000', 10),
  };
  return jwtConfig;
};
