[![Package version](https://badgen.net/npm/v/oxid)](https://www.npmjs.com/package/oxid)
[![Build Status](https://ojkwon.visualstudio.com/oxid/_apis/build/status/kwonoj.oxid?branchName=master)](https://ojkwon.visualstudio.com/oxid/_build/latest?definitionId=1)
[![Coverage](https://badgen.net/codecov/c/github/kwonoj/oxid)](https://codecov.io/gh/kwonoj/oxid/branch/master)
[![Node engine version](https://badgen.net/npm/node/oxid)](https://www.npmjs.com/package/oxid)

# Oxid

`oxid` is [rxjs observable](https://github.com/ReactiveX/rxjs) based isomorphic http request module.

## Install

This has a peer dependencies of `rxjs@6`, which will have to be installed as well

```sh
npm instll oxid
```

## Usage

Oxid exports default instance `oxid`, also exposes `Oxid` class to construct separate instances.

```ts
import { oxid, Oxid } from 'oxid';

oxid.get('url', options).subscribe();

const anotherInstance = new Oxid(customConfigurations);
anotherInstance.get('url', options).subscribe();
```

All of oxid's interface returns `Observable<HttpEvent<T>>` allows to subscribe into from base `request` function to http method function.

```ts
type requestMethodType = <T>(url: string, config?: RequestConfig) => Observable<HttpEvent<T>>;
type requestMethodWithDataType = <T, U>(url: string, data?: T, config?: RequestConfig) => Observable<HttpEvent<U>>;


class Oxid {
  public readonly delete: requestMethodType;
  public readonly get: requestMethodType;
  public readonly head: requestMethodType;
  public readonly options: requestMethodType;


  public readonly post: requestMethodWithDataType;
  public readonly put: requestMethodWithDataType;
  public readonly patch: requestMethodWithDataType;

  public request<T extends object | string = any>(url: string, config?: RequestConfig): Observable<HttpEvent<T>>;
  public request<T extends object | string = any>(url: string): Observable<HttpEvent<T>>;
  public request<T extends object | string = any>(config: RequestConfig): Observable<HttpEvent<T>>;
  public request<T extends object | string = any>(
    urlOrConfig: RequestConfig | string,
    config?: RequestConfig
  ): Observable<HttpEvent<T>> {
```

### Configure oxid
Oxid includes default set of configuration values. This value will be used when use request instance `oxid` or creating new instance `Oxid` without any custom configuration values. If partial configuration values are provided into when making request / constructing instance, it'll be merged into default configuration values.

```ts
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
```

Note `defaultOptions` object is immutable. Changing, reassigning values into existing default configuration value won't work, instead should supply new configuration object.

## Debugging internals of oxid

Oxid itself doesn't have mechanism to write log. Instead, it exposes a function to wire any logger used in application.

```ts
function enableLogger(logger: logFunctionType): void;
function enableLogger(logger: Partial<Logger>): void;
function enableLogger(logger: logFunctionType | Partial<Logger>);
```

It could be either single function, or object have loglevels like debug, info, warn, error. Notes `enableLogger` is **Global function** to affects any instance of oxid, and only starts emitting log once after `enableLogger` has been called.

```ts
import { enableLogger, oxid } from 'oxid';

// logs are not emitted
oxid.get().subscribe();

enableLogger(console.log.bind(console));

// now internal logs will be emitted via console
oxid.get().subscribe();
```

## Building / Testing

Few npm scripts are supported for build / test code.

- `build`: Transpiles code to `dist`.
- `build:clean`: Clean up existing build.
- `test`: Run unit test. Does not require `build` before execute test.
- `lint`: Run lint over all codebases.

## Credits

While this module is **NOT** officially affiliated, it relies on lot of prior art from [`axios`](https://github.com/axios/axios) and [`@angular/http`](https://github.com/angular/angular/tree/master/packages/common/http). You may notice some similar logics and it is expected.