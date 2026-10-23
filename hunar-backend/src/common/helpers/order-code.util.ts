import * as crypto from 'crypto';
import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';

/** Exact format: LLD-DDL (e.g., AW3-90W) */
export const ORDER_CODE_REGEX = /^[A-Z]{2}[0-9]-[0-9]{2}[A-Z]$/;

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';

/**
 * Validates whether a given string is a valid Order Code (LLD-DDL format).
 */
export function isOrderCode(value: unknown): value is string {
  return typeof value === 'string' && ORDER_CODE_REGEX.test(value);
}

/**
 * Cryptographically generates a random Order Code following the exact LLD-DDL format:
 * - 2 uppercase letters (A-Z)
 * - 1 digit (0-9)
 * - hyphen '-'
 * - 2 digits (0-9)
 * - 1 uppercase letter (A-Z)
 * Yielding 17,576,000 unique combinations.
 */
export function generateOrderCode(): string {
  const randChar = (charset: string) => charset[crypto.randomInt(0, charset.length)];
  return `${randChar(LETTERS)}${randChar(LETTERS)}${randChar(DIGITS)}-${randChar(DIGITS)}${randChar(DIGITS)}${randChar(LETTERS)}`;
}

/**
 * Server-side unique Order Code generator with collision checking and retry loop.
 */
export async function generateUniqueOrderCode(
  prisma: { serviceRequest: { findUnique: (args: { where: { id: string }; select: { id: true } }) => Promise<unknown> } },
  maxAttempts = 10,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateOrderCode();
    const existing = await prisma.serviceRequest.findUnique({
      where: { id: code },
      select: { id: true },
    });
    if (!existing) {
      return code;
    }
  }
  throw new Error('Failed to generate a unique Order Code after maximum retry attempts');
}

/**
 * NestJS Pipe to validate route parameters expecting an Order Code (LLD-DDL).
 */
@Injectable()
export class ParseOrderCodePipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const cleaned = typeof value === 'string' ? value.replace(/^#/, '').trim() : '';
    if (!cleaned || !ORDER_CODE_REGEX.test(cleaned)) {
      throw new BadRequestException(
        `Invalid Order Code format: "${value}". Must match LLD-DDL (e.g. AW3-90W).`,
      );
    }
    return cleaned;
  }
}

/**
 * Class-Validator decorator for DTOs to enforce valid Order Code format.
 */
export function IsOrderCode(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isOrderCode',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be a valid Order Code in format LLD-DDL (e.g. AW3-90W)`,
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          return isOrderCode(value);
        },
      },
    });
  };
}
