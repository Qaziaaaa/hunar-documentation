import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { STORAGE } from './storage/storage.provider';
import { StorageClient } from './storage/storage.interface';
import { ImageProcessor } from './processors/image.processor';
import { extensionFromMime, UploadCategory, UPLOAD_PRESETS } from './uploads.presets';

export interface UploadFileResult {
  key: string;
  url: string;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface UploadedObjectVariant {
  key: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
}

export interface UploadDocumentResult {
  key: string;
  url: string;
  original: UploadedObjectVariant;
  compressed: UploadedObjectVariant;
}

export function isDocumentResult(
  result: UploadFileResult | UploadDocumentResult,
): result is UploadDocumentResult {
  return 'original' in result && 'compressed' in result;
}

@Injectable()
export class UploadsService {
  constructor(
    @Inject(STORAGE) private readonly storage: StorageClient,
    private readonly imageProcessor: ImageProcessor,
  ) {}

  uploadProfilePhoto(userId: string, file: Express.Multer.File): Promise<UploadFileResult> {
    return this.uploadPhoto(UploadCategory.PROFILE_PHOTO, userId, file);
  }

  uploadJobPhoto(userId: string, file: Express.Multer.File): Promise<UploadFileResult> {
    return this.uploadPhoto(UploadCategory.JOB_PHOTO, userId, file);
  }

  uploadInspectionPhoto(userId: string, file: Express.Multer.File): Promise<UploadFileResult> {
    return this.uploadPhoto(UploadCategory.INSPECTION_PHOTO, userId, file);
  }

  uploadChatImage(userId: string, file: Express.Multer.File): Promise<UploadFileResult> {
    return this.uploadPhoto(UploadCategory.CHAT_IMAGE, userId, file);
  }

  uploadWorkerDocument(userId: string, file: Express.Multer.File): Promise<UploadDocumentResult> {
    return this.uploadDocument(UploadCategory.WORKER_DOCUMENT, userId, file);
  }

  uploadCnicDocument(userId: string, file: Express.Multer.File): Promise<UploadDocumentResult> {
    return this.uploadDocument(UploadCategory.CNIC_DOCUMENT, userId, file);
  }

  getUrl(key: string): string {
    return this.storage.getPublicUrl(key);
  }

  async deleteFile(key: string, userId: string): Promise<{ key: string }> {
    const preset = Object.values(UPLOAD_PRESETS).find((p) => key.startsWith(`${p.folder}/`)) ?? {
      folder: '',
    };
    const prefix = `${preset.folder}/${userId}/`;
    if (!key.startsWith(prefix)) {
      throw new ForbiddenException('UPLOAD_DELETE_FORBIDDEN: you can only delete your own files');
    }
    try {
      await this.storage.delete(key);
    } catch {
      throw new NotFoundException('UPLOAD_NOT_FOUND: no stored file matches the given key');
    }
    return { key };
  }

  private async uploadPhoto(
    category: UploadCategory,
    userId: string,
    file: Express.Multer.File,
  ): Promise<UploadFileResult> {
    const preset = UPLOAD_PRESETS[category];
    const compressed = await this.compress(this.requireFile(file).buffer, preset.compress);
    const key = `${preset.folder}/${userId}/${randomUUID()}.jpg`;
    await this.store(key, compressed.mimeType, compressed.data);
    return {
      key,
      url: this.storage.getPublicUrl(key),
      mimeType: compressed.mimeType,
      width: compressed.width,
      height: compressed.height,
      sizeBytes: compressed.sizeBytes,
    };
  }

  // Documents keep the original file AND a compressed version (Task 4 §4).
  private async uploadDocument(
    category: UploadCategory,
    userId: string,
    file: Express.Multer.File,
  ): Promise<UploadDocumentResult> {
    const preset = UPLOAD_PRESETS[category];
    const id = randomUUID();
    const fileToStore = this.requireFile(file);
    const originalKey = `${preset.folder}/${userId}/${id}.${extensionFromMime(fileToStore.mimetype)}`;
    const compressed = await this.compress(fileToStore.buffer, preset.compress);
    const compressedKey = `${preset.folder}/${userId}/${id}.compressed.jpg`;

    try {
      await this.store(originalKey, fileToStore.mimetype, fileToStore.buffer);
      await this.store(compressedKey, compressed.mimeType, compressed.data);
    } catch (error) {
      await this.cleanupFailedUpload([originalKey, compressedKey]);
      throw error;
    }

    return {
      key: originalKey,
      url: this.storage.getPublicUrl(originalKey),
      original: {
        key: originalKey,
        url: this.storage.getPublicUrl(originalKey),
        mimeType: fileToStore.mimetype,
        sizeBytes: fileToStore.buffer.length,
      },
      compressed: {
        key: compressedKey,
        url: this.storage.getPublicUrl(compressedKey),
        mimeType: compressed.mimeType,
        width: compressed.width,
        height: compressed.height,
        sizeBytes: compressed.sizeBytes,
      },
    };
  }

  private requireFile(file: Express.Multer.File | undefined): Express.Multer.File {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new HttpException('FILE_REQUIRED: no file uploaded', HttpStatus.BAD_REQUEST);
    }
    return file;
  }

  private async compress(input: Buffer, options: { maxSizePx: number; quality: number }) {
    try {
      return await this.imageProcessor.compress(input, options);
    } catch {
      throw new HttpException(
        'UPLOAD_PROCESSING_FAILED: file could not be processed as an image',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async store(key: string, contentType: string, data: Buffer): Promise<void> {
    try {
      await this.storage.put(key, data, contentType);
    } catch {
      throw new HttpException(
        'UPLOAD_FAILED: file could not be stored',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async cleanupFailedUpload(keys: string[]): Promise<void> {
    for (const key of keys) {
      try {
        await this.storage.delete(key);
      } catch {
        // Best-effort cleanup; orphans are handled manually by admins.
      }
    }
  }
}
