import { URLSearchParams } from 'url';
import { buildURL, combineURLs, isAbsoluteURL, isURLSameOrigin } from '../../src/utils/urls';

describe('urls', () => {
  describe('buildURL', () => {
    it('should support null params', () => {
      expect(buildURL('/foo')).toEqual('/foo');
    });

    it('should support params', () => {
      expect(
        buildURL('/foo', {
          foo: 'bar'
        })
      ).toEqual('/foo?foo=bar');
    });

    it('should support object params', () => {
      expect(
        buildURL('/foo', {
          foo: {
            bar: 'baz'
          }
        })
      ).toEqual('/foo?foo=' + encodeURI('{"bar":"baz"}'));
    });

    it('should support date params', () => {
      let date = new Date();

      expect(
        buildURL('/foo', {
          date: date
        })
      ).toEqual('/foo?date=' + date.toISOString());
    });

    it('should support array params', () => {
      expect(
        buildURL('/foo', {
          foo: ['bar', 'baz']
        })
      ).toEqual('/foo?foo[]=bar&foo[]=baz');
    });

    it('should support special char params', () => {
      expect(
        buildURL('/foo', {
          foo: '@:$, '
        })
      ).toEqual('/foo?foo=@:$,+');
    });

    it('should support existing params', () => {
      expect(
        buildURL('/foo?foo=bar', {
          bar: 'baz'
        })
      ).toEqual('/foo?foo=bar&bar=baz');
    });

    it('should support "length" parameter', () => {
      expect(
        buildURL('/foo', {
          query: 'bar',
          start: 0,
          length: 5
        })
      ).toEqual('/foo?query=bar&start=0&length=5');
    });

    it('should correct discard url hash mark', () => {
      expect(
        buildURL('/foo?foo=bar#hash', {
          query: 'baz'
        })
      ).toEqual('/foo?foo=bar&query=baz');
    });

    it('should use serializer if provided', () => {
      const serializer = jest.fn(() => 'foo=bar');
      const params = { foo: 'bar' };
      expect(buildURL('/foo', params, serializer)).toEqual('/foo?foo=bar');

      expect(serializer.mock.calls).toHaveLength(1);
      expect(serializer.mock.calls[0][0]).toEqual(params);
    });

    it('should support URLSearchParams', () => {
      expect(buildURL('/foo', new URLSearchParams('bar=baz'))).toEqual('/foo?bar=baz');
    });
  });

  describe('combineURLs', () => {
    it('should combine URLs', () => {
      expect(combineURLs('https://api.github.com', '/users')).toBe('https://api.github.com/users');
    });

    it('should remove duplicate slashes', () => {
      expect(combineURLs('https://api.github.com/', '/users')).toBe('https://api.github.com/users');
    });

    it('should insert missing slash', () => {
      expect(combineURLs('https://api.github.com', 'users')).toBe('https://api.github.com/users');
    });

    it('should not insert slash when relative url missing/empty', () => {
      expect(combineURLs('https://api.github.com/users', '')).toBe('https://api.github.com/users');
    });

    it('should allow a single slash for relative url', () => {
      expect(combineURLs('https://api.github.com/users', '/')).toBe('https://api.github.com/users/');
    });
  });

  describe('isAbsoluteURL', () => {
    it('should return true if URL begins with valid scheme name', () => {
      expect(isAbsoluteURL('https://api.github.com/users')).toBe(true);
      expect(isAbsoluteURL('custom-scheme-v1.0://example.com/')).toBe(true);
      expect(isAbsoluteURL('HTTP://example.com/')).toBe(true);
    });

    it('should return false if URL begins with invalid scheme name', () => {
      expect(isAbsoluteURL('123://example.com/')).toBe(false);
      expect(isAbsoluteURL('!valid://example.com/')).toBe(false);
    });

    it('should return true if URL is protocol-relative', () => {
      expect(isAbsoluteURL('//example.com/')).toBe(true);
    });

    it('should return false if URL is relative', () => {
      expect(isAbsoluteURL('/foo')).toBe(false);
      expect(isAbsoluteURL('foo')).toBe(false);
    });
  });

  // NOTE: this test passes via jsdom on node.js
  describe('isURLSameOrigin', function() {
    it('should detect same origin', function() {
      expect(isURLSameOrigin(window.location.href)).toEqual(true);
    });

    it('should detect different origin', function() {
      expect(isURLSameOrigin('https://github.com/axios/axios')).toEqual(false);
    });
  });
});
