import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendOtp(phone: string, code: string): Promise<void> {
    // MVP: no live SMS gateway connected yet. The OTP is always written to the
    // server log so an operator (or demo environment) can read it. Wire a real
    // gateway here (e.g. Twilio/EasyPaisa) for production SMS delivery.
    this.logger.log(`[OTP] ${phone}: ${code}`);
  }
}
