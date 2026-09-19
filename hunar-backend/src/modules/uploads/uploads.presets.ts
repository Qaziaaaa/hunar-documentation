import { HttpException, HttpStatus } from '@nestjs/common';
import { memoryStorage } from 'multer';

export enum UploadCategory {
  PROFILE_PHOTO = 'profile-photo',
  JOB_PHOTO = 'job-photo',
  INSPECTION_PHOTO = 'inspection-photo',
  CHAT_IMAGE = 'chat-image',
  WORKER_DOCUMENT = 'worker-document',
  CNIC_DOCUMENT = 'cnic-document',
  WALLET_SCREENSHOT = 'wallet-screenshot',
}

export interface CompressOptions {
  maxSizePx: number;
  quality: number;
}

export interface UploadPreset {
  category: UploadCategory;
  folder: string;
  isDocument: boolean;
  allowedMimeTypes: string[];
  maxBytes: number;
  compress?: CompressOptions;
}

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MB = 1024 * 1024;

export const UPLOAD_PRESETS: Record<UploadCategory, UploadPreset> = {
  [UploadCategory.PROFILE_PHOTO]: {
    category: UploadCategory.PROFILE_PHOTO,
    folder: 'profile-photos',
    isDocument: false,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    maxBytes: 5 * MB,
    compress: { maxSizePx: 1024, quality: 80 },
  },
  [UploadCategory.JOB_PHOTO]: {
    category: UploadCategory.JOB_PHOTO,
    folder: 'job-photos',
    isDocument: false,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    maxBytes: 5 * MB,
    compress: { maxSizePx: 1600, quality: 80 },
  },
  [UploadCategory.INSPECTION_PHOTO]: {
    category: UploadCategory.INSPECTION_PHOTO,
    folder: 'inspection-photos',
    isDocument: false,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    maxBytes: 5 * MB,
    compress: { maxSizePx: 1600, quality: 80 },
  },
  [UploadCategory.CHAT_IMAGE]: {
    category: UploadCategory.CHAT_IMAGE,
    folder: 'chat-images',
    isDocument: false,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    maxBytes: 5 * MB,
    compress: { maxSizePx: 1920, quality: 80 },
  },
  [UploadCategory.WORKER_DOCUMENT]: {
    category: UploadCategory.WORKER_DOCUMENT,
    folder: 'worker-documents',
    isDocument: true,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    maxBytes: 5 * MB,
    compress: { maxSizePx: 1600, quality: 75 },
  },
  [UploadCategory.CNIC_DOCUMENT]: {
    category: UploadCategory.CNIC_DOCUMENT,
    folder: 'cnic-documents',
    isDocument: true,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    maxBytes: 5 * MB,
    compress: { maxSizePx: 1600, quality: 75 },
  },
  [UploadCategory.WALLET_SCREENSHOT]: {
    category: UploadCategory.WALLET_SCREENSHOT,
    folder: 'wallet-screenshots',
    isDocument: false,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    maxBytes: 5 * MB,
    compress: { maxSizePx: 1600, quality: 80 },
  },
};

export interface MulterUploadOptions {
  storage: ReturnType<typeof memoryStorage>;
  limits: { fileSize: number; files: number };
  fileFilter: (
    req: unknown,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => void;
}

export function multerOptions(category: UploadCategory): MulterUploadOptions {
  const preset = UPLOAD_PRESETS[category];
  return {
    storage: memoryStorage(),
    limits: { fileSize: preset.maxBytes, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (!preset.allowedMimeTypes.includes(file.mimetype)) {
        return cb(
          new HttpException(
            `UNSUPPORTED_FILE_TYPE: this endpoint accepts ${preset.allowedMimeTypes.join(', ')}`,
            HttpStatus.UNSUPPORTED_MEDIA_TYPE,
          ),
          false,
        );
      }
      return cb(null, true);
    },
  };
}

export function extensionFromMime(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'bin';
  }
}
