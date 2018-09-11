import * as URLSearchParams from 'url-search-params';
import { buildURL } from '../../src/utils/buildURL';

describe('helpers::buildURL', () => {
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
    //serializer = sinon.stub();
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