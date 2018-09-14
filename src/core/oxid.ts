import { Observable, of, throwError } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { RequestConfig } from '../Request';
import { OxidResponse } from '../Response';
import { isString } from '../utils/base';
import { buildURL } from '../utils/urls';
import { dispatchRequest } from './dispatchRequest';

/**
 * Oxid::Request has polymorphic overload allows (url, config) form, build requestConfig via given params.
 *
 * @param urlOrConfig
 * @param config
 */
const buildConfig = (urlOrConfig: RequestConfig | string, config?: RequestConfig): RequestConfig => {
  const baseConfig = (isString(urlOrConfig) ? config : urlOrConfig) || {};
  if (isString(urlOrConfig)) {
    baseConfig.url = urlOrConfig;
  }

  return {
    ...baseConfig,
    url: baseConfig.url ? baseConfig.url.toLowerCase() : 'get'
  };
};

class Oxid {
  public readonly delete: (url: string, config: RequestConfig) => void;
  public readonly get: (url: string, config: RequestConfig) => void;
  public readonly head: (url: string, config: RequestConfig) => void;
  public readonly options: (url: string, config: RequestConfig) => void;

  public readonly post: <T>(url: string, data: T, config: RequestConfig) => void;
  public readonly put: <T>(url: string, data: T, config: RequestConfig) => void;
  public readonly patch: <T>(url: string, data: T, config: RequestConfig) => void;

  public readonly interceptors: {
    request: Array<{ next: (config: RequestConfig) => RequestConfig; error: (err: any) => any }>;
    response: Array<{ next: <T = any, U = T>(response: OxidResponse<T>) => OxidResponse<U>; error: (err: any) => any }>;
  } = {
    request: [],
    response: []
  };

  constructor(private readonly baseConfig: RequestConfig) {
    ['delete', 'get', 'head', 'options'].forEach(
      (method: any) => (this[method] = (url: string, config: RequestConfig) => this.request({ ...config, method, url }))
    );

    ['post', 'put', 'patch'].forEach(
      (method: any) =>
        (this[method] = (url: string, data: any, config: RequestConfig) =>
          this.request({ ...config, data, method, url }))
    );
  }

  public request<T extends object | string = any>(url: string, config?: RequestConfig): Observable<OxidResponse<T>>;
  public request<T extends object | string = any>(url: string): Observable<OxidResponse<T>>;
  public request<T extends object | string = any>(config: RequestConfig): Observable<OxidResponse<T>>;
  public request<T extends object | string = any>(
    urlOrConfig: RequestConfig | string,
    config?: RequestConfig
  ): Observable<OxidResponse<T>> {
    const mergedConfig: RequestConfig = {
      ...this.baseConfig,
      ...buildConfig(urlOrConfig, config)
    };

    const { request, response } = this.interceptors;
    const buildInterceptorOperators = (interceptors: Array<any>) =>
      interceptors.reduce(
        (acc, { next, error }) => {
          acc.push(map(next));
          acc.push(catchError(err => throwError(error(err))));
          return acc;
        },
        [] as any
      );

    //https://github.com/ReactiveX/rxjs/issues/3989
    return (of(mergedConfig).pipe as any)(
      ...buildInterceptorOperators(request),
      mergeMap(value => dispatchRequest<T>(value)),
      ...buildInterceptorOperators(response)
    );
  }

  public getUri(config: RequestConfig) {
    const { url, params, paramsSerializer } = {
      ...this.baseConfig,
      ...buildConfig(config)
    };

    if (!url) {
      throw new Error(`Invalid request configuration`);
    }

    return buildURL(url, params, paramsSerializer).replace(/^\?/, '');
  }
}

export { Oxid };
