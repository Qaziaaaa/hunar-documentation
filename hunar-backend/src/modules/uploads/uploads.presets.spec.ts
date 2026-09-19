import { HttpException, HttpStatus } from '@nestjs/common';
import {
  extensionFromMime,
  multerOptions,
  UploadCategory,
  UPLOAD_PRESETS,
} from './uploads.presets';

function makeFile(mimetype: string): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'x',
    encoding: '7bit',
    mimetype,
    size: 1,
    buffer: Buffer.from('x'),
  } as Express.Multer.File;
}

function invokeFilter(category: UploadCategory, mimetype: string): Promise<Error | null> {
  return new Promise((resolve) => {
    const { fileFilter } = multerOptions(category);
    fileFilter({}, makeFile(mimetype), (error) => resolve(error));
  });
}

describe('uploads.presets', () => {
  it('defines exactly the six required categories', () => {
    expect(Object.keys(UploadCategory)).toHaveLength(7);
    for (const category of Object.values(UploadCategory)) {
      expect(UPLOAD_PRESETS[category].folder).toBeTruthy();
      expect(UPLOAD_PRESETS[category].compress).toBeTruthy();
    }
  });

  it('documents retain an original and keep a compressed config', () => {
    expect(UPLOAD_PRESETS[UploadCategory.WORKER_DOCUMENT].isDocument).toBe(true);
    expect(UPLOAD_PRESETS[UploadCategory.CNIC_DOCUMENT].isDocument).toBe(true);
    expect(UPLOAD_PRESETS[UploadCategory.PROFILE_PHOTO].isDocument).toBe(false);
  });

  it('accepts image file types on every category', async () => {
    for (const category of Object.values(UploadCategory)) {
      await expect(invokeFilter(category, 'image/jpeg')).resolves.toBeNull();
      await expect(invokeFilter(category, 'image/png')).resolves.toBeNull();
      await expect(invokeFilter(category, 'image/webp')).resolves.toBeNull();
    }
  });

  it('rejects unsupported file types with UNSUPPORTED_FILE_TYPE', async () => {
    for (const category of Object.values(UploadCategory)) {
      const error = await invokeFilter(category, 'application/pdf');
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
      expect((error as HttpException).message).toContain('UNSUPPORTED_FILE_TYPE');
    }
  });

  it('caps each upload at 5 MB', () => {
    for (const category of Object.values(UploadCategory)) {
      expect(UPLOAD_PRESETS[category].maxBytes).toBe(5 * 1024 * 1024);
    }
  });

  it('maps mime types to file extensions', () => {
    expect(extensionFromMime('image/jpeg')).toBe('jpg');
    expect(extensionFromMime('image/png')).toBe('png');
    expect(extensionFromMime('image/webp')).toBe('webp');
  });
});
