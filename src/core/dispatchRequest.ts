import { defaultOptions } from '../defaultOptions';
import { RequestConfig, Transformer } from '../Request';
import { combineURLs, isAbsoluteURL } from '../utils/urls';

import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { OxidResponse } from '../Response';

/**
 * @internal
 * Transform the data for a request or a response
 *
 * @param {Object|String} data The data to be transformed
 * @param {Array} headers The headers for the request or response
 * @param {Array|Function} transformFunctions A single function or Array of functions
 * @returns {*} The resulting transformed data
 */
const transformData = (
  data: object | string,
  headers: Array<Record<string, any>>,
  transformFunction?: Array<Transformer> | Transformer
): object => {
  const functionArray = Array.isArray(transformFunction)
    ? transformFunction
    : !!transformFunction
      ? [transformFunction]
      : [];
  return functionArray.reduce((acc, value) => value(acc, headers), data as any);
};

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {RequestConfig} config The config that is to be used for the request
 */
const dispatchRequest = <T extends object | string = any>(config: RequestConfig) => {
  if (!config.url || !config.method) {
    throw new Error('Invalid request configuration');
  }

  // Support baseURL config
  if (config.baseURL && !isAbsoluteURL(config.url)) {
    config.url = combineURLs(config.baseURL, config.url);
  }

  // Ensure headers exist
  config.headers = config.headers || {};

  // Transform request data
  config.data = transformData(config.data, config.headers, config.transformRequest);

  // Flatten headers
  // TODO: verify flatten behavior
  const current = config.headers;
  config.headers = {
    ...(current.common || {}),
    ...(current[config.method] || {}),
    ...(current || {})
  };

  ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'].forEach(method => delete config.headers[method]);

  const adapter = config.adapter || defaultOptions.adapter;

  return adapter<T>(config).pipe(
    map(response => {
      const { data, headers } = response;
      // Transform response data
      return {
        ...response,
        data: transformData(data, headers, config.transformResponse)
      };
    }),
    catchError((err: { response?: OxidResponse<T> }) => {
      //object can be typeof Error, do not clone via spread but apply transform to mutate
      if (!!err && !!err.response) {
        const { data, headers } = err.response;
        err.response.data = transformData(data, headers, config.transformResponse) as T;
      }
      return of(err);
    })
  );
};

export { transformData, dispatchRequest };
