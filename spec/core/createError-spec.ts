import { createError, enhanceError } from '../../src/core/createError';

describe('createError', () => {
  it('should create an Error with message, config, code, request, response', () => {
    const request = { path: '/foo' };
    const response = { status: 200, data: { foo: 'bar' } };
    const error = createError('Boom!', { foo: 'bar' }, 'ESOMETHING', request, response);

    expect(error instanceof Error).toBe(true);
    expect(error.message).toBe('Boom!');
    expect(error.config).toEqual({ foo: 'bar' });
    expect(error.code).toBe('ESOMETHING');
    expect(error.request).toBe(request);
    expect(error.response).toBe(response);
    expect(error.fromOxid).toBe(true);
  });

  it('should create an Error that can be serialized to JSON', () => {
    // Attempting to serialize request and response results in
    //    TypeError: Converting circular structure to JSON
    const request = { path: '/foo' };
    const response = { status: 200, data: { foo: 'bar' } };
    const error = createError('Boom!', { foo: 'bar' }, 'ESOMETHING', request, response);
    const json = error.toJSON();

    expect(json.message).toBe('Boom!');
    expect(json.config).toEqual({ foo: 'bar' });
    expect(json.code).toBe('ESOMETHING');
    expect(json.request).toBe(undefined);
    expect(json.response).toBe(undefined);
  });
});

describe('enhanceError', () => {
  it('should add config, config, request and response to error', () => {
    const originalError = new Error('Boom!');
    const request = { path: '/foo' };
    const response = { status: 200, data: { foo: 'bar' } };

    const error = enhanceError(originalError, { foo: 'bar' }, 'ESOMETHING', request, response);
    expect(error.config).toEqual({ foo: 'bar' });
    expect(error.code).toBe('ESOMETHING');
    expect(error.request).toBe(request);
    expect(error.response).toBe(response);
    expect(error.fromOxid).toBe(true);
  });

  it('should return error', () => {
    const err = new Error('Boom!');
    expect(enhanceError(err, { foo: 'bar' }, 'ESOMETHING')).toBe(err);
  });
});
