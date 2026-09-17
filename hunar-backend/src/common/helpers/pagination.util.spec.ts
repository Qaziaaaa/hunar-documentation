import { normalizePage, toPageResult } from './pagination.util';

describe('normalizePage', () => {
  it('defaults to page 1 / limit 20', () => {
    expect(normalizePage({})).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it('applies offset pagination', () => {
    expect(normalizePage({ page: 3, limit: 10 })).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it('clamps invalid values', () => {
    expect(normalizePage({ page: 0, limit: 0 })).toEqual({ page: 1, limit: 1, skip: 0 });
    expect(normalizePage({ page: -5, limit: 1000 }).limit).toBe(50);
  });
});

describe('toPageResult', () => {
  it('wraps items with computed meta', () => {
    const res = toPageResult(['a', 'b'], 42, 2, 10);
    expect(res.items).toEqual(['a', 'b']);
    expect(res.meta).toEqual({ page: 2, limit: 10, total: 42, totalPages: 5 });
  });

  it('returns 0 pages when there are no records', () => {
    expect(toPageResult([], 0, 1, 20).meta.totalPages).toBe(0);
  });
});
