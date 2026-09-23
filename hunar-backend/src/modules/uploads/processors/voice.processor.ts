import { Injectable } from '@nestjs/common';

export interface ProcessedVoiceNote {
  data: Buffer;
  mimeType: string;
  sizeBytes: number;
}

// Voice notes are stored as-is (no transcoding in the current pipeline — the
// upload preset enforces the audio/* allow-list + size cap via Multer). This
// processor keeps the same shape as ImageProcessor so the uploads service can
// treat audio through a uniform pipeline.
@Injectable()
export class VoiceProcessor {
  process(input: Buffer, mimeType: string): ProcessedVoiceNote {
    return {
      data: input,
      mimeType,
      sizeBytes: input.length,
    };
  }
}
