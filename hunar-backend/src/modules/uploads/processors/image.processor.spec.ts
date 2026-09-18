import sharp from 'sharp';
import { ImageProcessor } from './image.processor';

describe('ImageProcessor', () => {
  const processor = new ImageProcessor();

  async function makePng(width: number, height: number): Promise<Buffer> {
    return sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 200, g: 100, b: 50 },
      },
    })
      .png()
      .toBuffer();
  }

  it('downscales a large image to the max size while preserving aspect ratio', async () => {
    const source = await makePng(2000, 1000);

    const result = await processor.compress(source, { maxSizePx: 500, quality: 80 });

    expect(result.format).toBe('jpeg');
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.width).toBe(500);
    expect(result.height).toBe(250);
    expect(result.sizeBytes).toBe(result.data.length);
    expect(result.sizeBytes).toBeLessThan(source.length);
  });

  it('does not enlarge a small image', async () => {
    const source = await makePng(100, 50);

    const result = await processor.compress(source, { maxSizePx: 500, quality: 80 });

    expect(result.width).toBe(100);
    expect(result.height).toBe(50);
  });

  it('compresses an alpha (PNG) image to an opaque JPEG', async () => {
    const source = await sharp({
      create: {
        width: 400,
        height: 300,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0.5 },
      },
    })
      .png()
      .toBuffer();

    const result = await processor.compress(source, { maxSizePx: 1024, quality: 70 });

    expect(result.format).toBe('jpeg');
    expect(result.data.length).toBeLessThan(source.length);
  });
});
