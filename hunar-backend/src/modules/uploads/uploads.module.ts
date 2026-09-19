import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { ImageProcessor } from './processors/image.processor';
import { storageProvider } from './storage/storage.provider';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService, ImageProcessor, storageProvider],
  exports: [UploadsService, ImageProcessor],
})
export class UploadsModule {}
