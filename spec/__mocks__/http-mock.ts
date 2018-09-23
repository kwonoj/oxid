import { EventEmitter } from 'events';
import { IncomingMessage, RequestOptions } from 'http';
import * as sinon from 'sinon';

class MockRequestTransport {
  public aborted = false;
  public readonly on = sinon.stub();
  public readonly once = sinon.stub();
  public readonly emit = sinon.stub();
  public readonly write = sinon.stub();
  public readonly end = sinon.stub();
  public readonly abort = sinon.stub();
}

class MockHttp {
  public options: RequestOptions;
  public requestTransportMock: MockRequestTransport;
  public requestCallback: Function;
  public request(options: any, cb: Function) {
    this.options = options;
    this.requestCallback = cb;
    return (this.requestTransportMock = new MockRequestTransport());
  }

  public mockFlush(status: number, statusText: string, body?: string) {
    const response: IncomingMessage = new EventEmitter() as any;
    response.headers = {};
    response.statusCode = status;
    response.statusMessage = statusText;

    this.requestCallback(response);
    response.emit('data', body ? Buffer.from(body as any) : null);
    response.emit('end');
  }

  public mockErrorEvent(error: any, abortBeforeEmit: boolean = false) {
    const response = new EventEmitter() as any;
    response.headers = {};
    this.requestCallback(response);

    this.requestTransportMock.aborted = abortBeforeEmit;
    response.emit('error', error);
  }

  public clear(): void {
    this.options = null as any;
    this.requestCallback = null as any;
    this.requestTransportMock = null as any;
  }
}

export { MockHttp };
