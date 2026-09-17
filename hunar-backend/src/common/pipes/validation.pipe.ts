import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';

// Global validation pipe using class-validator (backend-internal-libraries.md #3).
export class AppValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = errors
          .map((e) => Object.values(e.constraints ?? {}).join(', '))
          .filter(Boolean);
        return new BadRequestException(messages.length ? messages.join('; ') : 'Validation failed');
      },
    });
  }
}
