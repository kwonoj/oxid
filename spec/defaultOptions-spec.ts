import { defaultOptions } from '../src/defaultOptions';

//TODO: verify config value change via index import for oxid instance
//(remaining tests in default.spec.js)
describe('defaultOptions', () => {
  it('should transform request json', () => {
    expect(defaultOptions.transformRequest[0]({ foo: 'bar' }, null as any)).toEqual('{"foo":"bar"}');
  });

  it('should do nothing to request string', () => {
    expect(defaultOptions.transformRequest[0]('foo=bar', null as any)).toEqual('foo=bar');
  });

  it('should transform response json', () => {
    let data = defaultOptions.transformResponse[0]('{"foo":"bar"}');

    expect(typeof data).toEqual('object');
    expect(data.foo).toEqual('bar');
  });

  it('should do nothing to response string', () => {
    expect(defaultOptions.transformResponse[0]('foo=bar')).toEqual('foo=bar');
  });
});