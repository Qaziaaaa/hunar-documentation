export interface StorageClient {
  readonly driver: 's3' | 'minio' | 'local';
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}
