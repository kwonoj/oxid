import { Observable } from 'rxjs';

type Method = 'get' | 'delete' | 'head' | 'options' | 'post' | 'put' | 'patch';

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

//TODO: Observable type need to be defined
interface Adapter {
  (config: Requestconfig): Observable<any>;
}

interface Transformer {
  (data: any, headers?: any): any;
}

interface Requestconfig {
  url?: string;
  method?: Method;
  baseURL?: string;
  transformRequest?: Transformer | Array<Transformer>;
  transformResponse?: Transformer | Array<Transformer>;
  headers?: any;
  params?: any;
  paramsSerializer?: (params: any) => string;
  data?: any;
  withCredentials?: boolean;
  adapter?: Adapter;
  auth?: BasicCredentials;
  responseType?: ResponseType;
  xsrfCookieName?: string;
  xsrfHeaderName?: string;
  maxContentLength?: number;
  validateStatus?: (status: number) => boolean;
  maxRedirects?: number;
  socketPath?: string | null;
  httpAgent?: any;
  httpsAgent?: any;
  proxy?: ProxyConfig | false;
}

export { Method, Requestconfig, ProxyConfig, Adapter, Transformer, BasicCredentials };
