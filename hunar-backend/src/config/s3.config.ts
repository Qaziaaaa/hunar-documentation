export type StorageDriver = 's3' | 'minio' | 'local';

export interface StorageConfig {
  driver: StorageDriver;
  bucket: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
  port?: number;
  useSSL?: boolean;
  publicBaseUrl?: string;
  localPath?: string;
}

export default () => {
  const env = process.env.NODE_ENV ?? 'development';

  const driver: StorageDriver =
    (process.env.STORAGE_DRIVER as StorageDriver | undefined) ??
    (env === 'production' ? 's3' : 'local');

  const bucket = process.env.STORAGE_BUCKET ?? process.env.AWS_S3_BUCKET ?? 'hunar-uploads';

  const storageConfig: StorageConfig = {
    driver,
    bucket,
    region: process.env.AWS_REGION ?? 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? process.env.MINIO_ROOT_USER,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? process.env.MINIO_ROOT_PASSWORD,
    endpoint: process.env.MINIO_ENDPOINT ?? 'localhost',
    port: Number(process.env.MINIO_PORT ?? 9000),
    useSSL: (process.env.MINIO_USE_SSL ?? 'false') === 'true',
    publicBaseUrl: process.env.STORAGE_PUBLIC_BASE_URL || undefined,
    localPath: process.env.STORAGE_LOCAL_PATH ?? './uploads',
  };

  return { storage: storageConfig };
};
