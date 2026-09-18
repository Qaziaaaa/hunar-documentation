import { Client } from 'minio';
import { StorageConfig } from '../../../config/s3.config';
import { StorageClient } from './storage.interface';
import { encodeObjectKey } from './s3.storage';

export class MinioStorage implements StorageClient {
  readonly driver = 'minio' as const;
  private readonly client: Client;
  private readonly bucket: string;
  private readonly endpoint: string;
  private readonly port: number;
  private readonly useSSL: boolean;
  private readonly publicBaseUrl?: string;

  constructor(config: StorageConfig) {
    this.bucket = config.bucket;
    this.endpoint = config.endpoint ?? 'localhost';
    this.port = config.port ?? 9000;
    this.useSSL = config.useSSL ?? false;
    this.publicBaseUrl = config.publicBaseUrl;
    this.client = new Client({
      endPoint: this.endpoint,
      port: this.port,
      useSSL: this.useSSL,
      accessKey: config.accessKeyId ?? '',
      secretKey: config.secretAccessKey ?? '',
    });
  }

  async put(key: string, data: Buffer, contentType: string): Promise<void> {
    await this.client.putObject(this.bucket, key, data, data.length, {
      'Content-Type': contentType,
    });
  }

  async delete(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
  }

  getPublicUrl(key: string): string {
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl}/${encodeObjectKey(key)}`;
    }
    const scheme = this.useSSL ? 'https' : 'http';
    return `${scheme}://${this.endpoint}:${this.port}/${this.bucket}/${encodeObjectKey(key)}`;
  }
}
