import { StorageConfig } from '../../../config/s3.config';
import { StorageClient } from './storage.interface';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);

export class LocalStorage implements StorageClient {
  readonly driver = 'local' as const;
  private readonly basePath: string;
  private readonly publicBaseUrl?: string;

  constructor(config: StorageConfig) {
    this.basePath = config.localPath ?? './uploads';
    this.publicBaseUrl = config.publicBaseUrl;
  }

  private getFullPath(key: string): string {
    return path.join(this.basePath, key);
  }

  async put(key: string, data: Buffer, contentType: string): Promise<void> {
    const fullPath = this.getFullPath(key);
    const dir = path.dirname(fullPath);
    await mkdir(dir, { recursive: true });
    await writeFile(fullPath, data);
  }

  async delete(key: string): Promise<void> {
    const fullPath = this.getFullPath(key);
    try {
      await unlink(fullPath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
    }
  }

  getPublicUrl(key: string): string {
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl}/${key}`;
    }
    return `/uploads/${key}`;
  }

  async getFileInfo(key: string): Promise<{ size: number; contentType: string } | null> {
    const fullPath = this.getFullPath(key);
    try {
      const stats = await stat(fullPath);
      return { size: stats.size, contentType: 'application/octet-stream' };
    } catch {
      return null;
    }
  }
}