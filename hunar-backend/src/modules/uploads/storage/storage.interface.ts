export interface StorageClient {
  readonly driver: 's3' | 'minio';
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}
