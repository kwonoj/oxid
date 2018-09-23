import rewiremock from 'rewiremock';
import { Readable } from 'stream';
import { Adapter, RequestConfigNode } from '../../src';
import { oxidVersion } from '../../src/metadata';
import { HttpEventType, HttpResponse } from '../../src/Response';
import { expect, itOnly, TEST_POST, trackEvents } from '../__fixtures__/testHelper';
import { MockHttp } from '../__mocks__/http-mock';

rewiremock('follow-redirects').with({ http: new MockHttp(), https: new MockHttp() });
rewiremock('http').with(new MockHttp());
rewiremock('https').with(new MockHttp());

const XSSI_PREFIX = ")]}'\n";

/**
 * Except some tests need check paths for transport branch,
 * use mock via configuration
 */
const getTestPostRequest = () => {
  const mockHttp = new MockHttp();
  const post = {
    ...TEST_POST,
    transport: mockHttp as any
  } as RequestConfigNode;
  return { mockHttp, post };
};

describe('httpAdapter', () => {
  let adapter: Adapter;

  beforeEach(() => {
    rewiremock.enable();
    //tslint:disable-next-line:no-require-imports
    ({ adapter } = require('../../src/adapters/http'));
  });

  afterEach(() => {
    [
      (rewiremock.getMock('http') as any).mock.value,
      (rewiremock.getMock('https') as any).mock.value,
      ...(Object as any).values((rewiremock.getMock('follow-redirects') as any).mock.value)
    ].forEach(x => x.clear());
    rewiremock.disable();
  });

  it('emits status immediately', () => {
    const { next } = trackEvents(adapter(TEST_POST));
    expect(next).to.have.lengthOf(1);
    expect(next[0].type).to.equal(HttpEventType.Sent);
  });

  it('sets method, url correctly', () => {
    const { mockHttp, post } = getTestPostRequest();
    adapter(post).subscribe();

    expect(mockHttp.options).to.containSubset({
      method: 'POST',
      path: '/test'
    });
  });

  it('sets data without modification if stream provided', () => {
    const { mockHttp, post } = getTestPostRequest();

    const stream = new Readable();
    stream.push('your text here');
    stream.push(null);
    adapter({ ...post, data: stream }).subscribe();

    expect(mockHttp.options!.headers!['Content-Length']).to.be.undefined;
    expect(mockHttp.requestTransportMock.end.callCount).to.equal(0);
    expect(mockHttp.requestTransportMock.emit.args[0][1]).to.deep.equal(stream);
  });

  it('sets data without modification if buffer provided', () => {
    const { mockHttp, post } = getTestPostRequest();

    const buffer = Buffer.from('test buffer', 'utf-8');
    adapter({ ...post, data: buffer }).subscribe();
    const requestEnd = mockHttp.requestTransportMock.end;

    expect(mockHttp.options!.headers!['Content-Length']).to.equal(buffer.length);
    expect(requestEnd.callCount).to.equal(1);
    expect(requestEnd.args[0]).to.have.lengthOf(1);
    expect(requestEnd.args[0][0]).to.deep.equal(buffer);
  });

  it('sets data as buffer if arraybuffer provided', () => {
    const str2ab = (str: string) => {
      const array = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) {
        array[i] = str.charCodeAt(i);
      }
      return array;
    };

    const { mockHttp, post } = getTestPostRequest();

    const array = str2ab('test text');
    adapter({ ...post, data: array.buffer }).subscribe();
    const requestEnd = mockHttp.requestTransportMock.end;

    expect(mockHttp.options!.headers!['Content-Length']).to.equal(array.length);
    expect(requestEnd.callCount).to.equal(1);
    expect(requestEnd.args[0]).to.have.lengthOf(1);
    expect(requestEnd.args[0][0]).to.deep.equal(array);
  });

  it('sets data as buffer if string provided', () => {
    const { mockHttp, post } = getTestPostRequest();

    const data = 'test string';
    const buffer = Buffer.from(data, 'utf-8');
    adapter({ ...post, data: 'test string' }).subscribe();
    const requestEnd = mockHttp.requestTransportMock.end;

    expect(mockHttp.options!.headers!['Content-Length']).to.equal(buffer.length);

    expect(requestEnd.callCount).to.equal(1);
    expect(requestEnd.args[0]).to.have.lengthOf(1);
    expect(requestEnd.args[0][0]).to.deep.equal(buffer);
  });

  it('raises error if unexpected data type provided', () => {
    const { post } = getTestPostRequest();
    const { error } = trackEvents(
      adapter({
        ...post,
        data: {}
      })
    );

    expect(error).to.have.lengthOf(1);
    expect(error[0]).to.be.instanceof(Error);
  });

  it('sets outgoing headers, including default headers', () => {
    const { mockHttp, post } = getTestPostRequest();
    const updated = {
      ...post,
      headers: {
        Test: 'Test header'
      }
    };

    adapter(updated).subscribe();
    expect(mockHttp.options.headers).to.deep.equal({
      ...updated.headers,
      'User-Agent': `oxid/${oxidVersion}`
    });
  });

  it('sets outgoing headers, including overriding defaults', () => {
    const { mockHttp, post } = getTestPostRequest();
    const updated = {
      ...post,
      headers: {
        Test: 'Test header',
        'User-Agent': 'other user',
        Accept: 'text/html',
        'Content-Type': 'text/css'
      }
    };

    adapter(updated).subscribe();
    expect(mockHttp.options.headers).to.deep.equal(updated.headers);
  });

  it('should error if configuration is not valid', () => {
    const { post } = getTestPostRequest();
    const { error } = trackEvents(adapter({ ...post, url: null as any }));

    expect(error).to.have.lengthOf(1);
  });

  it('should accept socketPath instead of host', () => {
    const { mockHttp, post } = getTestPostRequest();
    trackEvents(adapter({ ...post, socketPath: 'other' }));

    expect(mockHttp.options.socketPath).to.equal('other');
  });

  it('should accept host with port', () => {
    const { mockHttp, post } = getTestPostRequest();
    trackEvents(adapter({ ...post, url: 'https://dummy.com:8080/test' }));

    expect(mockHttp.options).to.containSubset({
      hostname: 'dummy.com',
      path: '/test',
      port: '8080'
    });
  });

  it('should use auth configuration', () => {
    const { mockHttp, post } = getTestPostRequest();
    adapter({
      ...post,
      auth: {
        username: 'user',
        password: 'pwd'
      }
    }).subscribe();

    expect(mockHttp.options).to.containSubset({
      auth: `user:pwd`
    });

    adapter({
      ...post,
      auth: {
        username: 'user',
        password: null as any
      }
    }).subscribe();

    expect(mockHttp.options).to.containSubset({
      auth: `user:`
    });

    adapter({
      ...post,
      auth: {
        username: null as any,
        password: 'pwd',
        url: 'http://other:test@dummy.com'
      },
      headers: {
        Authorization: 'dummy'
      }
    }).subscribe();

    expect(mockHttp.options).to.containSubset({
      auth: `:pwd`
    });

    expect(mockHttp.options.headers!.Authorization).to.not.exist;
  });

  it('should use auth via url', () => {
    const { mockHttp, post } = getTestPostRequest();
    adapter({
      ...post,
      url: 'http://user:pwd@test.com',
      headers: {
        Authorization: 'dummy'
      }
    }).subscribe();

    expect(mockHttp.options).to.containSubset({
      auth: `user:pwd`
    });

    adapter({
      ...post,
      url: 'http://user@test.com'
    }).subscribe();

    expect(mockHttp.options).to.containSubset({
      auth: `user:`
    });

    adapter({
      ...post,
      url: 'http://:pwd@test.com',
      headers: {
        Authorization: 'dummy'
      }
    }).subscribe();

    expect(mockHttp.options).to.containSubset({
      auth: `:pwd`
    });

    expect(mockHttp.options.headers!.Authorization).to.not.exist;
  });

  it('should use proxy configuration', () => {
    const { mockHttp, post } = getTestPostRequest();
    adapter({
      ...post,
      url: 'https://other.com',
      proxy: {
        host: 'https://host2.com',
        port: 8800,
        auth: {
          username: 'user',
          password: 'pwd'
        }
      }
    }).subscribe();

    expect(mockHttp.options).to.containSubset({
      hostname: 'https://host2.com',
      host: 'https://host2.com',
      port: 8800,
      path: 'https://other.com/'
    });

    expect(mockHttp.options.headers).to.containSubset({
      'Proxy-Authorization': `Basic ${Buffer.from(`user:pwd`, 'utf8').toString('base64')}`
    });

    adapter({
      ...post,
      url: 'https://other.com:7788',
      proxy: {
        host: 'https://host2.com',
        port: 8800,
        auth: {
          username: 'user',
          password: 'pwd'
        }
      }
    }).subscribe();

    expect(mockHttp.options).to.containSubset({
      hostname: 'https://host2.com',
      host: 'https://host2.com',
      port: 8800,
      path: 'https://other.com:7788/'
    });
  });

  it('should use custom transport', () => {
    const dummy = new MockHttp();
    adapter({ ...TEST_POST, transport: dummy } as any).subscribe();

    expect(dummy.options).to.exist;
  });

  it('should use default http when redirect is not allowed', () => {
    adapter({ ...TEST_POST, maxRedirects: 0 } as any).subscribe();

    const mock = (rewiremock.getMock('http') as any).mock.value as MockHttp;
    expect(mock.options).to.exist;
  });

  it('should use default https when redirect is not allowed', () => {
    adapter({ ...TEST_POST, maxRedirects: 0, url: 'https://test.com' } as any).subscribe();

    const mock = (rewiremock.getMock('https') as any).mock.value as MockHttp;
    expect(mock.options).to.exist;
  });

  itOnly.node('should use redirect http', () => {
    adapter({ ...TEST_POST, maxRedirects: 1 } as any).subscribe();

    const mock = (rewiremock.getMock('follow-redirects') as any).mock.value.http as MockHttp;
    expect(mock.options).to.exist;
  });

  itOnly.node('should use redirect https', () => {
    adapter({ ...TEST_POST, maxRedirects: 1, url: 'https://test.com' } as any).subscribe();

    const mock = (rewiremock.getMock('follow-redirects') as any).mock.value.https as MockHttp;
    expect(mock.options).to.exist;
  });

  it('should set max content length', () => {
    const { mockHttp, post } = getTestPostRequest();
    adapter({ ...post, maxContentLength: 10 }).subscribe();

    expect((mockHttp.options as any).maxBodyLength).to.equal(10);
  });

  it('should emit error if response exceed max content length', () => {
    const { mockHttp, post } = getTestPostRequest();
    const { error } = trackEvents(adapter({ ...post, maxContentLength: 1 }));

    mockHttp.mockFlush(200, 'OK', 'some response');

    expect(error).to.have.length(1);
  });

  it('handles a text response', () => {
    const { mockHttp, post } = getTestPostRequest();
    const { next } = trackEvents(adapter(post));
    mockHttp.mockFlush(200, 'OK', 'some response');

    expect(next).to.have.lengthOf(2);
    expect(next[1].type).to.equal(HttpEventType.Response);
    expect(next[1]).containSubset({
      data: 'some response',
      status: 200,
      statusText: 'OK'
    });
  });

  it('handles a json response', () => {
    const { mockHttp, post } = getTestPostRequest();
    const { next } = trackEvents(
      adapter({
        ...post,
        responseType: 'json'
      })
    );
    mockHttp.mockFlush(200, 'OK', JSON.stringify({ data: 'some data' }));

    expect(next).to.have.lengthOf(2);
    expect(next[1].type).to.equal(HttpEventType.Response);
    expect(next[1]).containSubset({
      data: { data: 'some data' },
      status: 200,
      statusText: 'OK'
    });
  });

  it('handles a blank json response', () => {
    const { mockHttp, post } = getTestPostRequest();
    const { next } = trackEvents(
      adapter({
        ...post,
        responseType: 'json'
      })
    );
    mockHttp.mockFlush(200, 'OK', '');

    expect(next).to.have.lengthOf(2);
    expect(next[1].type).to.equal(HttpEventType.Response);
    expect(next[1]).containSubset({
      data: null,
      status: 200,
      statusText: 'OK'
    });
  });

  it('handles a json error response with default validateStatus', () => {
    const { mockHttp, post } = getTestPostRequest();
    const { next, error } = trackEvents(
      adapter({
        ...post,
        responseType: 'json'
      })
    );
    mockHttp.mockFlush(500, 'Error', JSON.stringify({ data: 'some data' }));

    expect(next).to.have.lengthOf(1);
    expect(error).to.have.lengthOf(1);
    expect(error[0].response!.data.data).to.equal('some data');
  });

  it('does not handle a json error if validateStatus not provided', () => {
    const { mockHttp, post } = getTestPostRequest();
    const { next, error } = trackEvents(
      adapter({
        ...post,
        responseType: 'json',
        validateStatus: undefined
      })
    );
    mockHttp.mockFlush(500, 'Error', JSON.stringify({ data: 'some data' }));

    expect(next).to.have.lengthOf(1);
    expect(error).to.have.lengthOf(1);
    expect(error[0].response!.data.data).to.equal('some data');
  });

  it('handles a json error response with XSSI prefix', () => {
    const { mockHttp, post } = getTestPostRequest();
    const { next, error } = trackEvents(
      adapter({
        ...post,
        responseType: 'json'
      })
    );

    mockHttp.mockFlush(500, 'Error', XSSI_PREFIX + JSON.stringify({ data: 'some data' }));

    expect(next).to.have.lengthOf(1);
    expect(error).to.have.lengthOf(1);
    expect(error[0].response!.data.data).to.equal('some data');
  });

  it('handles a json string response', () => {
    const { mockHttp, post } = getTestPostRequest();
    const { next } = trackEvents(
      adapter({
        ...post,
        responseType: 'json'
      })
    );

    mockHttp.mockFlush(200, 'OK', JSON.stringify('this is a string'));

    expect(next).to.have.lengthOf(2);
    expect((next[1] as HttpResponse<any>).data).to.equal('this is a string');
  });

  it('handles a json response with an XSSI prefix', () => {
    const { mockHttp, post } = getTestPostRequest();
    const { next } = trackEvents(
      adapter({
        ...post,
        responseType: 'json'
      })
    );

    mockHttp.mockFlush(200, 'OK', XSSI_PREFIX + JSON.stringify({ data: 'some data' }));

    expect(next).to.have.lengthOf(2);
    expect((next[1] as HttpResponse<any>).data.data).to.equal('some data');
  });

  it('emits unsuccessful responses via the error path', () => {
    const { mockHttp, post } = getTestPostRequest();
    const { error } = trackEvents(adapter(post));

    mockHttp.mockFlush(400, 'Bad Request', 'this is the error');

    expect(error[0]).to.be.instanceof(Error);
    expect(error[0].response!.data).to.equal('this is the error');
    expect(error[0].response!.status).to.equal(400);
  });

  it('emits real errors via the error path', () => {
    const { mockHttp, post } = getTestPostRequest();
    const { error } = trackEvents(adapter(post));

    mockHttp.mockErrorEvent(new Error('blah'));

    expect(error[0]).to.be.instanceof(Error);
  });

  it('do not emits errors via the error path when aborted', () => {
    const { mockHttp, post } = getTestPostRequest();
    const { error } = trackEvents(adapter(post));

    mockHttp.mockErrorEvent(new Error('blah'), true);

    expect(error).to.be.empty;
  });

  describe('corrects for quirks', () => {
    it('by normalizing 0 status to 200 if a body is present', () => {
      const { mockHttp, post } = getTestPostRequest();
      const { next } = trackEvents(adapter(post));

      mockHttp.mockFlush(0, 'CORS 0 status', 'Test');
      expect(next).to.have.lengthOf(2);
      expect((next[1] as HttpResponse<any>).status).to.equal(200);
    });

    it('by leaving 0 status as 0 if a body is not present', () => {
      const { mockHttp, post } = getTestPostRequest();
      const { next, error } = trackEvents(adapter(post));

      mockHttp.mockFlush(0, 'CORS 0 status');

      expect(next).to.have.lengthOf(1);
      expect(error).to.have.lengthOf(1);
      expect(error[0].response!.status).to.equal(0);
    });
  });
});
