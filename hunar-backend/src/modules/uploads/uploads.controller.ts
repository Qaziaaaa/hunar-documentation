import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { multerGenericOptions, multerOptions, UploadCategory } from './uploads.presets';
import { UploadsService } from './uploads.service';

// Path params hold dot-free object keys; clients must URL-encode the bucket key
// (slashes -> %2F) when calling the download URL / delete routes.
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('profile-photo')
  @Roles(Role.WORKER, Role.CUSTOMER)
  @UseInterceptors(FileInterceptor('file', multerOptions(UploadCategory.PROFILE_PHOTO)))
  uploadProfilePhoto(@CurrentUser() user: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadProfilePhoto(user.sub, file);
  }

  @Post('job-photo')
  @Roles(Role.CUSTOMER)
  @UseInterceptors(FileInterceptor('file', multerOptions(UploadCategory.JOB_PHOTO)))
  uploadJobPhoto(@CurrentUser() user: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadJobPhoto(user.sub, file);
  }

  @Post('inspection-photo')
  @Roles(Role.WORKER, Role.CUSTOMER)
  @UseInterceptors(FileInterceptor('file', multerOptions(UploadCategory.INSPECTION_PHOTO)))
  uploadInspectionPhoto(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadsService.uploadInspectionPhoto(user.sub, file);
  }

  @Post('chat-image')
  @Roles(Role.WORKER, Role.CUSTOMER)
  @UseInterceptors(FileInterceptor('file', multerOptions(UploadCategory.CHAT_IMAGE)))
  uploadChatImage(@CurrentUser() user: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadChatImage(user.sub, file);
  }

  @Post('worker-document')
  @Roles(Role.WORKER)
  @UseInterceptors(FileInterceptor('file', multerOptions(UploadCategory.WORKER_DOCUMENT)))
  uploadWorkerDocument(@CurrentUser() user: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadWorkerDocument(user.sub, file);
  }

  @Post('cnic-document')
  @Roles(Role.WORKER)
  @UseInterceptors(FileInterceptor('file', multerOptions(UploadCategory.CNIC_DOCUMENT)))
  uploadCnicDocument(@CurrentUser() user: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadCnicDocument(user.sub, file);
  }

  /** Task 27 — voice notes (customer ↔ worker, e.g. chat audio). */
  @Post('voice-note')
  @Roles(Role.WORKER, Role.CUSTOMER)
  @UseInterceptors(FileInterceptor('file', multerOptions(UploadCategory.VOICE_NOTE)))
  uploadVoiceNote(@CurrentUser() user: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadVoiceNote(user.sub, file);
  }

  /** Task 27 — generic POST /uploads (category passed as a multipart field). */
  @Post()
  @Roles(Role.WORKER, Role.CUSTOMER)
  @UseInterceptors(FileInterceptor('file', multerGenericOptions()))
  upload(
    @CurrentUser() user: JwtPayload,
    @Body('category') category: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadsService.upload(user.sub, category as UploadCategory, file);
  }

  @Get(':key/url')
  @Roles(Role.WORKER, Role.CUSTOMER)
  getUrl(@Param('key') key: string) {
    return { url: this.uploadsService.getUrl(key) };
  }

  @Delete(':key')
  @Roles(Role.WORKER, Role.CUSTOMER)
  deleteFile(@Param('key') key: string, @CurrentUser() user: JwtPayload) {
    return this.uploadsService.deleteFile(key, user.sub);
  }
}
