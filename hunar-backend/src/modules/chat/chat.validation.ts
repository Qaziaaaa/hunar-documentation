import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class SendMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  text?: string;

  /** Object key returned by POST /uploads/chat-image. Resolved to a stored URL server-side. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageKey?: string;
}

export class SendMessageByJobDto extends SendMessageDto {
  @IsNotEmpty()
  @IsString()
  jobId: string;
}

export class MessageListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
