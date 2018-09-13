import { RequestConfig } from './Request';

interface OxidResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: RequestConfig;
  request?: any;
}

export { OxidResponse };
