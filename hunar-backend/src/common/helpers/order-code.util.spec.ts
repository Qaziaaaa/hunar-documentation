import { BadRequestException } from '@nestjs/common';
import {
  generateOrderCode,
  generateUniqueOrderCode,
  isOrderCode,
  ORDER_CODE_REGEX,
  ParseOrderCodePipe,
} from './order-code.util';

describe('OrderCodeUtil', () => {
  describe('Format & Regex', () => {
    it('generates a valid order code matching LLD-DDL', () => {
      for (let i = 0; i < 50; i++) {
        const code = generateOrderCode();
        expect(ORDER_CODE_REGEX.test(code)).toBe(true);
        expect(isOrderCode(code)).toBe(true);
        expect(code).toMatch(/^[A-Z]{2}[0-9]-[0-9]{2}[A-Z]$/);
      }
    });

    it('accepts valid order codes', () => {
      const valids = ['AW3-90W', 'BK7-21M', 'ZT4-83Q', 'HD9-05X', 'AA0-00A', 'ZZ9-99Z'];
      for (const code of valids) {
        expect(isOrderCode(code)).toBe(true);
      }
    });

    it('rejects invalid order codes', () => {
      const invalids = [
        'aw3-90w', // lowercase
        'AW-390W', // hyphen in wrong place
        'AW390W', // missing hyphen
        'AW3-9OW', // letter O instead of digit 0
        '123456', // all numbers
        '1846fe6e-8663-4aab-923f-eb2dc90ae68a', // UUID
        '',
        null as unknown as string,
        undefined as unknown as string,
        'AW3-90WW', // extra character
        'A3-90W', // missing character
      ];
      for (const code of invalids) {
        expect(isOrderCode(code)).toBe(false);
      }
    });
  });

  describe('ParseOrderCodePipe', () => {
    const pipe = new ParseOrderCodePipe();

    it('accepts valid code and returns trimmed string', () => {
      expect(pipe.transform('AW3-90W')).toBe('AW3-90W');
      expect(pipe.transform(' BK7-21M ')).toBe('BK7-21M');
    });

    it('throws BadRequestException for invalid code', () => {
      expect(() => pipe.transform('invalid')).toThrow(BadRequestException);
      expect(() => pipe.transform('1846fe6e-8663-4aab-923f-eb2dc90ae68a')).toThrow(
        BadRequestException,
      );
      expect(() => pipe.transform('aw3-90w')).toThrow(BadRequestException);
    });
  });

  describe('generateUniqueOrderCode', () => {
    it('retries on collision until a unique code is found', async () => {
      let callCount = 0;
      const fakePrisma = {
        serviceRequest: {
          findUnique: jest.fn().mockImplementation(() => {
            callCount++;
            if (callCount < 3) {
              return Promise.resolve({ id: 'COLLISION' });
            }
            return Promise.resolve(null);
          }),
        },
      };

      const code = await generateUniqueOrderCode(fakePrisma, 10);
      expect(isOrderCode(code)).toBe(true);
      expect(callCount).toBe(3);
    });

    it('throws when max retries exceeded', async () => {
      const fakePrisma = {
        serviceRequest: {
          findUnique: jest.fn().mockResolvedValue({ id: 'EXISTS' }),
        },
      };

      await expect(generateUniqueOrderCode(fakePrisma, 3)).rejects.toThrow(
        'Failed to generate a unique Order Code',
      );
    });
  });
});
