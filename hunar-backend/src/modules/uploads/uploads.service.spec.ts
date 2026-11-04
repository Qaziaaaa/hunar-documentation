import { ForbiddenException, HttpException } from '@nestjs/common';
import { ImageProcessor } from './processors/image.processor';
import { VoiceProcessor } from './processors/voice.processor';
import { CompressOptions } from './uploads.presets';
import { StorageClient } from './storage/storage.interface';
import { isDocumentResult, UploadsService } from './uploads.service';

function makeStorage(): jest.Mocked<StorageClient> {
  return {
    driver: 'minio',
    put: jest.fn(async (_key: string, _data: Buffer, _contentType: string) => undefined),
    delete: jest.fn(async (_key: string) => undefined),
    getPublicUrl: jest.fn((key: string) => `http://localhost:9000/hunar-uploads/${key}`),
  };
}

function makeProcessor(): jest.Mocked<ImageProcessor> {
  return {
    compress: jest.fn(async (_input: Buffer, _options: CompressOptions) => ({
      data: Buffer.from('compressed-bytes'),
      format: 'jpeg' as const,
      mimeType: 'image/jpeg' as const,
      width: 800,
      height: 600,
      sizeBytes: 17,
    })),
  };
}

function makeFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  const buf = Buffer.alloc(400);
  buf[0] = 0xff;
  buf[1] = 0xd8;
  buf[2] = 0xff;
  buf[3] = 0xe0;
  return {
    fieldname: 'file',
    originalname: 'photo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 400,
    buffer: buf,
    ...overrides,
  } as Express.Multer.File;
}

describe('UploadsService', () => {
  let storage: jest.Mocked<StorageClient>;
  let processor: jest.Mocked<ImageProcessor>;
  let voiceProcessor: jest.Mocked<VoiceProcessor>;
  let service: UploadsService;

  beforeEach(() => {
    storage = makeStorage();
    processor = makeProcessor();
    voiceProcessor = {
      process: jest.fn((input: Buffer, mimeType: string) => ({
        data: Buffer.from(input),
        mimeType,
        sizeBytes: input.length,
      })),
    } as jest.Mocked<VoiceProcessor>;
    service = new UploadsService(storage, processor, voiceProcessor);
  });

  describe('photo categories', () => {
    it.each([
      ['profile photo', 'uploadProfilePhoto', 'profile-photos'],
      ['job photo', 'uploadJobPhoto', 'job-photos'],
      ['inspection photo', 'uploadInspectionPhoto', 'inspection-photos'],
      ['chat image', 'uploadChatImage', 'chat-images'],
    ])('stores a compressed %s under its folder', async (_name, method, folder) => {
      const file = makeFile();
      const result = await (service as any)[method]('w1', file);

      expect(result.mimeType).toBe('image/jpeg');
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
      expect(result.key.startsWith(`${folder}/w1/`)).toBe(true);
      expect(result.url).toBe(`http://localhost:9000/hunar-uploads/${result.key}`);
      expect(processor.compress).toHaveBeenCalledTimes(1);
      // Only the compressed variant is stored for photos.
      const putKeys = storage.put.mock.calls.map((call) => call[0]);
      expect(putKeys).toHaveLength(1);
      expect(putKeys[0]).toBe(result.key);
    });
  });

  describe('document categories', () => {
    it.each([
      ['worker document', 'uploadWorkerDocument', 'worker-documents'],
      ['CNIC document', 'uploadCnicDocument', 'cnic-documents'],
    ])('stores original + compressed for a %s', async (_name, method, folder) => {
      const file = makeFile();
      const result = await (service as any)[method]('w1', file);

      expect(isDocumentResult(result)).toBe(true);
      expect(result.original.key.startsWith(`${folder}/w1/`)).toBe(true);
      expect(result.original.key.endsWith('.jpg')).toBe(true);
      expect(result.original.sizeBytes).toBe(400);
      expect(result.compressed.key.endsWith('.compressed.jpg')).toBe(true);
      expect(result.compressed.mimeType).toBe('image/jpeg');
      expect(result.url).toBe(result.original.url);

      expect(storage.put).toHaveBeenCalledTimes(2);
      const [originalCall, compressedCall] = storage.put.mock.calls;
      expect(originalCall[0]).toBe(result.original.key);
      expect(originalCall[1]).toEqual(file.buffer);
      expect(compressedCall[0]).toBe(result.compressed.key);
    });

    it('keeps the uploaded file extension on the original variant', async () => {
      const pngBuf = Buffer.alloc(400);
      pngBuf[0] = 0x89;
      pngBuf[1] = 0x50;
      pngBuf[2] = 0x4e;
      pngBuf[3] = 0x47;
      pngBuf[4] = 0x0d;
      pngBuf[5] = 0x0a;
      pngBuf[6] = 0x1a;
      pngBuf[7] = 0x0a;
      const result = await (service as any).uploadWorkerDocument(
        'w1',
        makeFile({ mimetype: 'image/png', buffer: pngBuf }),
      );
      expect(result.original.key.endsWith('.png')).toBe(true);
      expect(result.original.mimeType).toBe('image/png');
    });
  });

  describe('validation and errors', () => {
    it('rejects a request with no file', async () => {
      await expect((service as any).uploadProfilePhoto('w1', undefined)).rejects.toThrow(
        HttpException,
      );
      await expect((service as any).uploadProfilePhoto('w1', undefined)).rejects.toThrow(
        /FILE_REQUIRED/,
      );
      expect(storage.put).not.toHaveBeenCalled();
    });

    it('surfaces processing failures as UPLOAD_PROCESSING_FAILED', async () => {
      processor.compress.mockRejectedValue(new Error('bad image'));

      await expect((service as any).uploadProfilePhoto('w1', makeFile())).rejects.toThrow(
        /UPLOAD_PROCESSING_FAILED/,
      );
      expect(storage.put).not.toHaveBeenCalled();
    });

    it('cleans up already-stored objects when a later storage write fails', async () => {
      storage.put.mockRejectedValueOnce(new Error('transient'));
      storage.put.mockRejectedValueOnce(new Error('disk full'));

      await expect((service as any).uploadWorkerDocument('w1', makeFile())).rejects.toThrow(
        /UPLOAD_FAILED/,
      );
      expect(storage.delete).toHaveBeenCalledTimes(2);
      const deletedKeys = storage.delete.mock.calls.map((call) => call[0]);
      expect(deletedKeys[0].endsWith('.png') || deletedKeys[0].endsWith('.jpg')).toBe(true);
    });
  });

  describe('lookup and deletion', () => {
    it('returns the public URL for a stored key', () => {
      expect(service.getUrl('job-photos/w1/abc.jpg')).toBe(
        'http://localhost:9000/hunar-uploads/job-photos/w1/abc.jpg',
      );
    });

    it('deletes a file owned by the caller', async () => {
      storage.delete.mockResolvedValueOnce(undefined);
      await expect(service.deleteFile('worker-documents/w1/doc.jpg', 'w1')).resolves.toEqual({
        key: 'worker-documents/w1/doc.jpg',
      });
      expect(storage.delete).toHaveBeenCalledWith('worker-documents/w1/doc.jpg');
    });

    it('forbids deleting another user file', async () => {
      await expect(service.deleteFile('worker-documents/w2/doc.jpg', 'w1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(storage.delete).not.toHaveBeenCalled();
    });

    it('forbids deleting a key outside any known category folder', async () => {
      await expect(service.deleteFile('private/notes.txt', 'w1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(storage.delete).not.toHaveBeenCalled();
    });
  });

    describe('magic byte signature validation (AUDIT-024)', () => {
      it('rejects an upload when binary magic numbers do not match any recognized signature', async () => {
        const fakeFile = makeFile({
          originalname: 'malicious.php.jpg',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('<?php echo "pwned"; ?>'),
        });

        await expect(service.uploadProfilePhoto('user-1', fakeFile)).rejects.toThrow(
          /FILE_SIGNATURE_INVALID: file contents do not match any recognized binary signature/,
        );
      });

      it('rejects an upload when magic bytes indicate a different unsupported MIME type for the category', async () => {
        // Valid WebM audio buffer: 1A 45 DF A3
        const webmAudio = Buffer.alloc(400);
        webmAudio[0] = 0x1a;
        webmAudio[1] = 0x45;
        webmAudio[2] = 0xdf;
        webmAudio[3] = 0xa3;

        const mismatchedFile = makeFile({
          originalname: 'audio-as-photo.jpg',
          mimetype: 'image/jpeg',
          buffer: webmAudio,
        });

        await expect(service.uploadProfilePhoto('user-1', mismatchedFile)).rejects.toThrow(
          /FILE_SIGNATURE_MISMATCH: file signature detected as "audio\/webm"/,
        );
      });

      it('successfully accepts valid PNG magic bytes', async () => {
        const pngBuf = Buffer.alloc(400);
        pngBuf[0] = 0x89;
        pngBuf[1] = 0x50;
        pngBuf[2] = 0x4e;
        pngBuf[3] = 0x47;
        pngBuf[4] = 0x0d;
        pngBuf[5] = 0x0a;
        pngBuf[6] = 0x1a;
        pngBuf[7] = 0x0a;

        const pngFile = makeFile({
          originalname: 'valid.png',
          mimetype: 'image/png',
          buffer: pngBuf,
        });

        const res = await service.uploadJobPhoto('user-1', pngFile);
        expect(res.key).toContain('job-photos/');
      });

      it('successfully accepts valid WebM magic bytes for voice notes', async () => {
        const webmBuf = Buffer.alloc(400);
        webmBuf[0] = 0x1a;
        webmBuf[1] = 0x45;
        webmBuf[2] = 0xdf;
        webmBuf[3] = 0xa3;

        const voiceFile = makeFile({
          originalname: 'voice.webm',
          mimetype: 'audio/webm',
          buffer: webmBuf,
        });

        const res = await service.uploadVoiceNote('user-1', voiceFile);
        expect(res.key).toContain('voice-notes/');
      });
    });

});
