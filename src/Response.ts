import { Requestconfig } from './Request';

interface OxidResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: Requestconfig;
  request?: any;
}

export { OxidResponse };
