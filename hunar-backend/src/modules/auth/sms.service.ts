import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendOtp(phone: string, code: string): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`[DEV OTP] ${phone}: ${code}`);
    }
  }
}
