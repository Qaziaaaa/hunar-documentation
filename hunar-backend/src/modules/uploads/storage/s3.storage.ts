import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { StorageConfig } from '../../../config/s3.config';
import { StorageClient } from './storage.interface';

export class S3Storage implements StorageClient {
  readonly driver = 's3' as const;
  private readonly client: S3Client;
  private readonly region: string;
  private readonly bucket: string;
  private readonly publicBaseUrl?: string;

  constructor(config: StorageConfig) {
    this.bucket = config.bucket;
    this.region = config.region ?? 'ap-south-1';
    this.publicBaseUrl = config.publicBaseUrl;
    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: config.accessKeyId ?? '',
        secretAccessKey: config.secretAccessKey ?? '',
      },
    });
  }

  async put(key: string, data: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
      }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  getPublicUrl(key: string): string {
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl}/${encodeObjectKey(key)}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${encodeObjectKey(key)}`;
  }
}

export function encodeObjectKey(key: string): string {
  return key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}
