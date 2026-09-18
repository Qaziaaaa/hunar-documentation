import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageConfig } from '../../../config/s3.config';
import { StorageClient } from './storage.interface';
import { S3Storage } from './s3.storage';
import { MinioStorage } from './minio.storage';

export const STORAGE = Symbol('STORAGE');

export function createStorage(config: StorageConfig): StorageClient {
  if (config.driver === 's3') {
    return new S3Storage(config);
  }
  if (config.driver === 'minio') {
    return new MinioStorage(config);
  }
  throw new Error(`Unsupported storage driver: ${String(config.driver)}`);
}

export const storageProvider: Provider = {
  provide: STORAGE,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => createStorage(config.get<StorageConfig>('storage')),
};
