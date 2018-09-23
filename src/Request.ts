import { Observable } from 'rxjs';
import { HttpEvent } from './Response';

type Method = 'get' | 'delete' | 'head' | 'options' | 'post' | 'put' | 'patch';
type ResponseType = 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream';

interface BasicCredentials {
  username: string;
  password: string;
}

interface ProxyConfig {
  host: string;
  port: number;
  auth?: BasicCredentials;
  protocol?: string;
}

interface Adapter {
  <T = any>(config: RequestConfig): Observable<HttpEvent<T>>;
}

interface Transformer {
  (data: object | string, headers?: Array<Record<string, any>>): object | string;
}

interface RequestConfigBase {
  url?: string;
  method?: Method;
  baseURL?: string;
  transformRequest?: Transformer | Array<Transformer>;
  transformResponse?: Transformer | Array<Transformer>;
  headers?: any;
  params?: any;
  paramsSerializer?: (params: any) => string;
  data?: any;
  adapter?: Adapter;
  auth?: BasicCredentials;
  responseType?: ResponseType;
  responseEncoding?: string;
  xsrfCookieName?: string;
  xsrfHeaderName?: string;
  maxContentLength?: number;
  validateStatus?: (status: number) => boolean;
  maxRedirects?: number;
  socketPath?: string | null;

  proxy?: ProxyConfig;
}

interface RequestConfigNode extends RequestConfigBase {
  /**
   * Custom agent to be used in node http request.
   */
  httpAgent?: any;
  /**
   * Custom agent to be used in node https request.
   */
  httpsAgent?: any;
  transport?: { request: typeof import('http').request };
}

interface RequestConfigBrowser extends RequestConfigBase {
  /**
   * Emit progress event for xhr request.
   */
  reportProgress?: boolean;
  withCredentials?: boolean;
}

/**
 * Union type of RequestConfig for node / browser.
 */
type RequestConfig = RequestConfigNode | RequestConfigBrowser;

export {
  Method,
  ResponseType,
  RequestConfigNode,
  RequestConfigBrowser,
  RequestConfig,
  ProxyConfig,
  Adapter,
  Transformer,
  BasicCredentials
};
