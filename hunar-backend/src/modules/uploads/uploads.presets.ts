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
  VOICE_NOTE = 'voice-note',
  CATEGORY_IMAGE = 'category-image',
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

const AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'audio/mp4',
  'audio/x-m4a',
];

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
  [UploadCategory.VOICE_NOTE]: {
    category: UploadCategory.VOICE_NOTE,
    folder: 'voice-notes',
    isDocument: false,
    allowedMimeTypes: AUDIO_MIME_TYPES,
    maxBytes: 10 * MB,
  },
  [UploadCategory.CATEGORY_IMAGE]: {
    category: UploadCategory.CATEGORY_IMAGE,
    folder: 'category-images',
    isDocument: false,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    maxBytes: 5 * MB,
    compress: { maxSizePx: 1024, quality: 80 },
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
      const baseMime = (file.mimetype || '').split(';')[0].trim().toLowerCase();
      if (
        !preset.allowedMimeTypes.includes(file.mimetype) &&
        !preset.allowedMimeTypes.includes(baseMime)
      ) {
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

/**
 * Permissive filter for the generic POST /uploads dispatcher: accepts every mime
 * type covered by the presets; the service then validates against the category.
 */
export function multerGenericOptions(): MulterUploadOptions {
  const allowed = [...new Set(Object.values(UPLOAD_PRESETS).flatMap((p) => p.allowedMimeTypes))];
  const maxBytes = Math.max(...Object.values(UPLOAD_PRESETS).map((p) => p.maxBytes));
  return {
    storage: memoryStorage(),
    limits: { fileSize: maxBytes, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (!allowed.includes(file.mimetype)) {
        return cb(
          new HttpException(
            `UNSUPPORTED_FILE_TYPE: this endpoint accepts ${allowed.join(', ')}`,
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
  const base = (mimeType || '').split(';')[0].trim().toLowerCase();
  switch (base) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'audio/mpeg':
    case 'audio/mp3':
      return 'mp3';
    case 'audio/ogg':
      return 'ogg';
    case 'audio/wav':
      return 'wav';
    case 'audio/webm':
      return 'webm';
    case 'audio/mp4':
      return 'm4a';
    case 'audio/x-m4a':
      return 'm4a';
    default:
      return 'bin';
  }
}

/**
 * Inspects binary magic numbers (file signatures) to detect the genuine file type,
 * protecting against client-spoofed Content-Type headers (AUDIT-024).
 */
export function detectMimeTypeFromMagicBytes(buffer: Buffer): string | null {
  if (!buffer || buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: RIFF .... WEBP
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  // WAV: RIFF .... WAVE
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WAVE'
  ) {
    return 'audio/wav';
  }

  // OGG: 4F 67 67 53 ('OggS')
  if (buffer.length >= 4 && buffer.toString('ascii', 0, 4) === 'OggS') {
    return 'audio/ogg';
  }

  // WebM / EBML / Matroska: 1A 45 DF A3
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return 'audio/webm';
  }

  // MP3 with ID3 header: 49 44 33 ('ID3')
  if (buffer.length >= 3 && buffer.toString('ascii', 0, 3) === 'ID3') {
    return 'audio/mpeg';
  }

  // MP3 sync bytes without ID3: FF FB, FF F3, FF F2
  if (
    buffer[0] === 0xff &&
    (buffer[1] & 0xe0) === 0xe0
  ) {
    return 'audio/mpeg';
  }

  // MP4 / M4A: .... ftyp
  if (buffer.length >= 8 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    return 'audio/mp4';
  }

  return null;
}
