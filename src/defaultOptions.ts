import * as isBuffer from 'is-buffer';

import { Adapter, RequestConfig } from './Request';
import {
  isArrayBuffer,
  isBlob,
  isFile,
  isFormData,
  isNode,
  isObject,
  isStream,
  isURLSearchParams,
  XSRF_HEADER_NAME
} from './utils/base';
import { normalizeHeaderName } from './utils/normalizeHeaderName';

const DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

const setContentTypeIfUnset = (headers: Record<string, any> | undefined, value: string) => {
  if (!!headers && !headers['Content-Type']) {
    headers['Content-Type'] = value;
  }
};

//tslint:disable-next-line:no-require-imports
const getDefaultAdapter = (): Adapter => (isNode() ? require('./adapters/http') : require('./adapters/xhr')).adapter;

/**
 * Default validator
 *
 */
const validateStatus = (status: number) => status >= 200 && status < 300;

/**
 * Default configuration values.
 */
const defaultOptions: Readonly<RequestConfig> = {
  adapter: getDefaultAdapter(),

  transformRequest: [
    (data: object | string, headers?: Array<Record<string, any>>) => {
      normalizeHeaderName(headers, 'Accept');
      normalizeHeaderName(headers, 'Content-Type');

      if (isFormData(data) || isArrayBuffer(data) || isBuffer(data) || isStream(data) || isFile(data) || isBlob(data)) {
        return data;
      }
      if (ArrayBuffer.isView(data)) {
        return data.buffer;
      }
      if (isURLSearchParams(data)) {
        setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
        return data.toString();
      }
      if (isObject(data)) {
        setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
        return JSON.stringify(data);
      }
      return data;
    }
  ],

  transformResponse: [
    (data: any) => {
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          /* noop */
        }
      }
      return data;
    }
  ],

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: XSRF_HEADER_NAME,

  maxContentLength: -1,

  validateStatus,

  headers: {
    common: {
      Accept: 'application/json, text/plain, */*'
    }
  }
};

['delete', 'get', 'head'].forEach(method => (defaultOptions.headers[method] = {}));
['post', 'put', 'patch'].forEach(method => {
  const current = defaultOptions.headers[method] || {};
  defaultOptions.headers[method] = {
    ...current,
    ...DEFAULT_CONTENT_TYPE
  };
});

export { defaultOptions, validateStatus };
