import { sanitizeToAreaOrSector, extractAreaFromAddress } from './location.util';

describe('location.util - sanitizeToAreaOrSector', () => {
  it('extracts Hayatabad Phase 3 from the exact user prompt example', () => {
    const result = sanitizeToAreaOrSector({
      address: 'House 123, Street 5, Hayatabad Phase 3, Near XYZ Market, Peshawar',
      city: 'Peshawar',
    });
    expect(result).toBe('Hayatabad Phase 3');
  });

  it('preserves clean area when already provided', () => {
    const result = sanitizeToAreaOrSector({
      area: 'Hayatabad Phase 3',
      address: 'House 123, Street 5, Hayatabad Phase 3, Near XYZ Market, Peshawar',
      city: 'Peshawar',
    });
    expect(result).toBe('Hayatabad Phase 3');
  });

  it('strips redundant city suffix from area', () => {
    const result = sanitizeToAreaOrSector({
      area: 'Hayatabad Phase 3, Peshawar',
      city: 'Peshawar',
    });
    expect(result).toBe('Hayatabad Phase 3');
  });

  it('extracts sector and phase when house number is present in address', () => {
    const result = sanitizeToAreaOrSector({
      address: 'House 42-B, Sector D-1, Phase 3, Hayatabad, Peshawar',
      city: 'Peshawar',
    });
    expect(result).toBe('Sector D-1, Phase 3, Hayatabad');
  });

  it('extracts University Town and ignores lane / circular road', () => {
    const result = sanitizeToAreaOrSector({
      address: 'Lane 7, Circular Road, University Town, Peshawar',
      city: 'Peshawar',
    });
    expect(result).toBe('University Town');
  });

  it('extracts Ring Road and ignores landmark near Achini Chowk', () => {
    const result = sanitizeToAreaOrSector({
      address: 'Near Achini Chowk, Ring Road, Peshawar',
      city: 'Peshawar',
    });
    expect(result).toBe('Ring Road');
  });

  it('extracts Gulbahar No. 4 and ignores Street 2', () => {
    const result = sanitizeToAreaOrSector({
      address: 'Street 2, Gulbahar No. 4, Peshawar',
      city: 'Peshawar',
    });
    expect(result).toBe('Gulbahar No. 4');
  });

  it('falls back to city instead of leaking house/street when only street details exist', () => {
    const result = sanitizeToAreaOrSector({
      address: 'House 12, Street 4',
      city: 'Peshawar',
    });
    expect(result).toBe('Peshawar');
    expect(result).not.toContain('House');
    expect(result).not.toContain('Street');
  });

  it('returns Location pending when both address and area are empty', () => {
    const result = sanitizeToAreaOrSector({});
    expect(result).toBe('Location pending');
  });
});
