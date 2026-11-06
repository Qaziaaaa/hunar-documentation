import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { request as httpsRequest } from 'https';

const BREVO_TRANSACTIONAL_EMAIL_URL = 'https://api.brevo.com/v3/smtp/email';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('brevo.apiKey') &&
        this.config.get<string>('brevo.senderEmail'),
    );
  }

  async sendWorkerOtp(email: string, otp: string): Promise<boolean> {
    const apiKey = this.config.get<string>('brevo.apiKey');
    const senderEmail = this.config.get<string>('brevo.senderEmail');
    const senderName = this.config.get<string>('brevo.senderName', 'WorkerFix');

    if (!apiKey || !senderEmail) {
      if (process.env.OTP_DEBUG !== 'false') {
        this.logger.warn(`[OTP] Email service is not configured. ${email}: ${otp}`);
        return false;
      }
      throw new ServiceUnavailableException('Email service is not configured');
    }

    const payload = {
      sender: { email: senderEmail, name: senderName },
      to: [{ email }],
      subject: 'WorkerFix - Email Verification Code',
      textContent: [
        'Hello,',
        '',
        'Thank you for registering with WorkerFix.',
        '',
        'Your email verification code is:',
        '',
        otp,
        '',
        'This code is valid for 5 minutes.',
        '',
        'Please do not share your verification code with anyone.',
        '',
        'Thank you,',
        'WorkerFix Team',
      ].join('\n'),
      htmlContent: `
        <div style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
          <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <div style="background:#0f766e;padding:20px 24px;color:#ffffff;">
              <h1 style="margin:0;font-size:20px;font-weight:700;">WorkerFix</h1>
            </div>
            <div style="padding:24px;">
              <p style="margin:0 0 12px;">Hello,</p>
              <p style="margin:0 0 12px;">Thank you for registering with WorkerFix.</p>
              <p style="margin:0 0 8px;">Your email verification code is:</p>
              <p style="margin:0 0 16px;font-size:30px;font-weight:700;letter-spacing:8px;color:#0f766e;">${otp}</p>
              <p style="margin:0 0 12px;">This code is valid for 5 minutes.</p>
              <p style="margin:0 0 12px;">Please do not share your verification code with anyone.</p>
              <p style="margin:0;">Thank you,<br/>WorkerFix Team</p>
            </div>
          </div>
        </div>
      `,
    };

    let response: { status: number; body: string };
    try {
      response = await this.postToBrevo(apiKey, payload);
    } catch (error) {
      this.logger.error(
        `[OTP] Email delivery transport failed for ${email}:`,
        error instanceof Error ? error.stack : String(error),
      );
      if (process.env.OTP_DEBUG !== 'false') {
        this.logger.warn(`[OTP] Email delivery failed. ${email}: ${otp}`);
        return false;
      }
      throw new BadGatewayException('Unable to send verification email. Please try again.');
    }

    if (response.status < 200 || response.status >= 300) {
      this.logger.error(
        `Brevo email delivery failed with status ${response.status}: ${response.body}`,
      );
      if (process.env.OTP_DEBUG !== 'false') {
        this.logger.warn(`[OTP] Email delivery failed. ${email}: ${otp}`);
        return false;
      }
      throw new BadGatewayException('Unable to send verification email. Please try again.');
    }

    return true;
  }

  /**
   * Brevo can be configured to reject IPv6 (the machine's IPv6 addresses are
   * not allowlisted), so make the request over IPv4 explicitly. Node's global
   * fetch may pick IPv6 first, resulting in a 401 "unrecognised IP address".
   */
  private postToBrevo(
    apiKey: string,
    payload: unknown,
  ): Promise<{ status: number; body: string }> {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);
      const req = httpsRequest(
        BREVO_TRANSACTIONAL_EMAIL_URL,
        {
          method: 'POST',
          family: 4,
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'api-key': apiKey,
            'content-length': Buffer.byteLength(data),
          },
        },
        (res) => {
          let body = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
        },
      );
      req.on('error', reject);
      req.setTimeout(15_000, () => req.destroy(new Error('Brevo request timed out')));
      req.write(data);
      req.end();
    });
  }
}
