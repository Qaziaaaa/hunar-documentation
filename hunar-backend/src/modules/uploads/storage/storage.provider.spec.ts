import { StorageConfig } from '../../../config/s3.config';
import { createStorage } from './storage.provider';
import { S3Storage } from './s3.storage';
import { MinioStorage } from './minio.storage';

function config(overrides: Partial<StorageConfig> = {}): StorageConfig {
  return {
    driver: 'minio',
    bucket: 'hunar-uploads',
    region: 'ap-south-1',
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
    endpoint: 'localhost',
    port: 9000,
    useSSL: false,
    ...overrides,
  };
}

describe('createStorage', () => {
  it('builds a MinIO client in development', () => {
    const storage = createStorage(config({ driver: 'minio' }));
    expect(storage.driver).toBe('minio');
    expect(storage).toBeInstanceOf(MinioStorage);
    expect(storage.getPublicUrl('profile-photos/w1/a.jpg')).toBe(
      'http://localhost:9000/hunar-uploads/profile-photos/w1/a.jpg',
    );
  });

  it('builds an S3 client in production', () => {
    const storage = createStorage(config({ driver: 's3' }));
    expect(storage.driver).toBe('s3');
    expect(storage).toBeInstanceOf(S3Storage);
    expect(storage.getPublicUrl('profile-photos/w1/a.jpg')).toBe(
      'https://hunar-uploads.s3.ap-south-1.amazonaws.com/profile-photos/w1/a.jpg',
    );
  });

  it('supports a public base URL override (CDN) for both drivers', () => {
    const base = 'https://cdn.hunar.app/files';
    const minioStorage = createStorage(config({ driver: 'minio', publicBaseUrl: base }));
    const s3Storage = createStorage(config({ driver: 's3', publicBaseUrl: base }));

    expect(minioStorage.getPublicUrl('cnic-documents/w1/x.jpg')).toBe(
      'https://cdn.hunar.app/files/cnic-documents/w1/x.jpg',
    );
    expect(s3Storage.getPublicUrl('cnic-documents/w1/x.jpg')).toBe(
      'https://cdn.hunar.app/files/cnic-documents/w1/x.jpg',
    );
  });

  it('uses https when MinIO is configured with SSL', () => {
    const storage = createStorage(config({ driver: 'minio', useSSL: true }));
    expect(storage.getPublicUrl('job-photos/w1/a.jpg')).toBe(
      'https://localhost:9000/hunar-uploads/job-photos/w1/a.jpg',
    );
  });

  it('rejects an unknown driver', () => {
    expect(() => createStorage(config({ driver: 'gcs' as StorageConfig['driver'] }))).toThrow(
      /Unsupported storage driver/,
    );
  });
});
