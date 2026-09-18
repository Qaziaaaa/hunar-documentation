import { registerDecorator, ValidationOptions } from 'class-validator';

const PAKISTANI_MOBILE_LOCAL = /^3\d{9}$/;

export function normalizePakistaniPhone(raw: string): string | null {
  if (!raw || typeof raw !== 'string') {
    return null;
  }
  let digits = raw.replace(/[\s-]/g, '');
  if (digits.startsWith('+')) {
    digits = digits.slice(1);
  }
  if (digits.startsWith('92')) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (!PAKISTANI_MOBILE_LOCAL.test(digits)) {
    return null;
  }
  return `0${digits}`;
}

export function IsPakistaniPhone(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate: (value: unknown): boolean =>
          typeof value === 'string' && normalizePakistaniPhone(value) !== null,
        defaultMessage: (): string => 'phone must be a valid Pakistani mobile number',
      },
    });
  };
}
