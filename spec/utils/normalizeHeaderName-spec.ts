import { normalizeHeaderName } from '../../src/utils/normalizeHeaderName';

describe('normalizeHeaderName', () => {
  it('should normalize matching header name', () => {
    const headers = {
      'conTenT-Type': 'foo/bar'
    };
    normalizeHeaderName(headers, 'Content-Type');
    expect(headers['Content-Type']).toBe('foo/bar');
    expect(headers['conTenT-Type']).toBeUndefined();
  });

  it('should not change non-matching header name', () => {
    const headers = {
      'content-type': 'foo/bar'
    };
    normalizeHeaderName(headers, 'Content-Length');
    expect(headers['content-type']).toBe('foo/bar');
    expect(headers['Content-Length']).toBeUndefined();
  });
});
