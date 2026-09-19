import { ForbiddenException, HttpException } from '@nestjs/common';
import { ImageProcessor } from './processors/image.processor';
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
  return {
    fieldname: 'file',
    originalname: 'photo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 400,
    buffer: Buffer.alloc(400),
    ...overrides,
  } as Express.Multer.File;
}

describe('UploadsService', () => {
  let storage: jest.Mocked<StorageClient>;
  let processor: jest.Mocked<ImageProcessor>;
  let service: UploadsService;

  beforeEach(() => {
    storage = makeStorage();
    processor = makeProcessor();
    service = new UploadsService(storage, processor);
  });

  describe('photo categories', () => {
    it.each([
      ['profile photo', 'uploadProfilePhoto', 'profile-photos'],
      ['job photo', 'uploadJobPhoto', 'job-photos'],
      ['inspection photo', 'uploadInspectionPhoto', 'inspection-photos'],
      ['chat image', 'uploadChatImage', 'chat-images'],
    ])('stores a compressed %s under its folder', async (_name, method, folder) => {
      const result = await (service as any)[method]('w1', makeFile());

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
      const result = await (service as any)[method]('w1', makeFile());

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
      expect(originalCall[1]).toEqual(Buffer.alloc(400));
      expect(compressedCall[0]).toBe(result.compressed.key);
    });

    it('keeps the uploaded file extension on the original variant', async () => {
      const result = await (service as any).uploadWorkerDocument(
        'w1',
        makeFile({ mimetype: 'image/png' }),
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
});
