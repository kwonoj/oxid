import * as chai from 'chai';
import { expect } from 'chai';
import { Observable } from 'rxjs';
import { validateStatus } from '../../src/defaultOptions';
import { RequestConfig } from '../../src/Request';
import { HttpErrorResponse, HttpEvent } from '../../src/Response';

let imported = false;
(() => {
  if (!imported) {
    const subset = require('chai-subset'); //tslint:disable-line:no-require-imports no-var-requires
    chai.use(subset);

    imported = true;
  }
})();

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

const describeOnly = {
  node: isBrowser ? describe.skip : describe,
  browser: isBrowser ? describe : describe.skip
};

const itOnly = {
  node: isBrowser ? it.skip : it,
  browser: isBrowser ? it : it.skip
};

/**
 * Request configuration for test post method.
 */
const TEST_POST: RequestConfig = {
  url: '/test',
  method: 'post',
  data: 'some body',
  responseType: 'text',
  validateStatus: validateStatus
};

/**
 * Utility function to subscribe request observable, collect emitted responses.
 */
const trackEvents = (obs: Observable<HttpEvent<any>>) => {
  const events = {
    next: [] as Array<HttpEvent<any>>,
    error: [] as Array<HttpErrorResponse>
  };
  obs.subscribe(event => events.next.push(event), err => events.error.push(err));
  return events;
};

export { describeOnly, itOnly, TEST_POST, trackEvents, expect };
