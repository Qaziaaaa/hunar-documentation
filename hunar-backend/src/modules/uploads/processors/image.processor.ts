import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { CompressOptions } from '../uploads.presets';

export interface CompressedImage {
  data: Buffer;
  format: 'jpeg';
  mimeType: 'image/jpeg';
  width: number;
  height: number;
  sizeBytes: number;
}

// Compresses/optimizes photo + document scans before storage (backend-internal-libraries.md #13).
@Injectable()
export class ImageProcessor {
  async compress(input: Buffer, options: CompressOptions): Promise<CompressedImage> {
    const { maxSizePx, quality } = options;
    const { data, info } = await sharp(input, { failOn: 'none' })
      .rotate()
      .resize({ width: maxSizePx, height: maxSizePx, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });

    return {
      data,
      format: 'jpeg',
      mimeType: 'image/jpeg',
      width: info.width,
      height: info.height,
      sizeBytes: data.length,
    };
  }
}
