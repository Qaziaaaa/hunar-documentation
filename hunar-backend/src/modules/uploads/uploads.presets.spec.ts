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
  const IMAGE_CATEGORIES = Object.values(UploadCategory).filter(
    (category) => category !== UploadCategory.VOICE_NOTE,
  );

  it('defines the eight required upload categories', () => {
    expect(Object.keys(UploadCategory)).toHaveLength(8);
    for (const category of Object.values(UploadCategory)) {
      expect(UPLOAD_PRESETS[category].folder).toBeTruthy();
    }
    for (const category of IMAGE_CATEGORIES) {
      expect(UPLOAD_PRESETS[category].compress).toBeTruthy();
    }
  });

  it('dedicates VOICE_NOTE to audio uploads', () => {
    const preset = UPLOAD_PRESETS[UploadCategory.VOICE_NOTE];
    expect(preset.isDocument).toBe(false);
    expect(preset.maxBytes).toBe(10 * 1024 * 1024);
    for (const mime of ['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/webm']) {
      expect(preset.allowedMimeTypes).toContain(mime);
    }
  });

  it('documents retain an original and keep a compressed config', () => {
    expect(UPLOAD_PRESETS[UploadCategory.WORKER_DOCUMENT].isDocument).toBe(true);
    expect(UPLOAD_PRESETS[UploadCategory.CNIC_DOCUMENT].isDocument).toBe(true);
    expect(UPLOAD_PRESETS[UploadCategory.PROFILE_PHOTO].isDocument).toBe(false);
  });

  it('accepts image file types on every image category', async () => {
    for (const category of IMAGE_CATEGORIES) {
      await expect(invokeFilter(category, 'image/jpeg')).resolves.toBeNull();
      await expect(invokeFilter(category, 'image/png')).resolves.toBeNull();
      await expect(invokeFilter(category, 'image/webp')).resolves.toBeNull();
    }
  });

  it('accepts audio file types on the voice note category', async () => {
    await expect(invokeFilter(UploadCategory.VOICE_NOTE, 'audio/mpeg')).resolves.toBeNull();
    await expect(invokeFilter(UploadCategory.VOICE_NOTE, 'audio/webm')).resolves.toBeNull();
  });

  it('keeps image and audio uploads mutually exclusive by category', async () => {
    const imageReject = await invokeFilter(UploadCategory.VOICE_NOTE, 'image/jpeg');
    expect(imageReject).toBeInstanceOf(HttpException);
    const audioReject = await invokeFilter(UploadCategory.PROFILE_PHOTO, 'audio/mpeg');
    expect(audioReject).toBeInstanceOf(HttpException);
  });

  it('rejects unsupported file types with UNSUPPORTED_FILE_TYPE', async () => {
    for (const category of Object.values(UploadCategory)) {
      const error = await invokeFilter(category, 'application/pdf');
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
      expect((error as HttpException).message).toContain('UNSUPPORTED_FILE_TYPE');
    }
  });

  it('caps image uploads at 5 MB and voice notes at 10 MB', () => {
    for (const category of IMAGE_CATEGORIES) {
      expect(UPLOAD_PRESETS[category].maxBytes).toBe(5 * 1024 * 1024);
    }
    expect(UPLOAD_PRESETS[UploadCategory.VOICE_NOTE].maxBytes).toBe(10 * 1024 * 1024);
  });

  it('maps mime types to file extensions', () => {
    expect(extensionFromMime('image/jpeg')).toBe('jpg');
    expect(extensionFromMime('image/png')).toBe('png');
    expect(extensionFromMime('image/webp')).toBe('webp');
    expect(extensionFromMime('audio/mpeg')).toBe('mp3');
    expect(extensionFromMime('audio/wav')).toBe('wav');
  });
});
