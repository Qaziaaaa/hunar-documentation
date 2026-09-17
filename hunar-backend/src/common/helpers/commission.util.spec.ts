import { calculateCommission } from './commission.util';

describe('calculateCommission', () => {
  it('charges 10% of the locked visit charge by default', () => {
    expect(calculateCommission(1000)).toBe(100);
    expect(calculateCommission(1500)).toBe(150);
    expect(calculateCommission(250)).toBe(25);
  });

  it('uses the configured rate when provided', () => {
    expect(calculateCommission(2000, 0.2)).toBe(400);
    expect(calculateCommission(1000, 0.12)).toBe(120);
  });

  it('rounds to 2 decimal places', () => {
    expect(calculateCommission(333)).toBe(33.3);
    expect(calculateCommission(0.01 * 100)); // 1 -> 0.1
    expect(calculateCommission(1234.56, 0.1)).toBe(123.46);
  });

  it('returns 0 for zero charge', () => {
    expect(calculateCommission(0)).toBe(0);
  });

  it('rejects negative values', () => {
    expect(() => calculateCommission(-100)).toThrow();
    expect(() => calculateCommission(100, -0.1)).toThrow();
  });
});
