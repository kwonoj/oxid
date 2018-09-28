import { http as httpFollow } from 'follow-redirects';
import { https as httpsFollow } from 'follow-redirects';
import * as http from 'http';
import * as https from 'https';
import { Observable, Observer } from 'rxjs';
import * as url from 'url';
import * as zlib from 'zlib';

import { oxidVersion } from '../metadata';
import { RequestConfigNode, ResponseType } from '../Request';
import { HttpEvent, HttpEventType, HttpResponse } from '../Response';
import { isString } from '../utils/base';
import { isArrayBuffer, isStream } from '../utils/base';
import { createError, enhanceError } from '../utils/createError';
import { getObserverHandler } from '../utils/getObserverHandler';
import { getLogger } from '../utils/log';
import { parseJsonResponse } from '../utils/parseJsonResponse';
import { buildURL } from '../utils/urls';

const log = getLogger(`httpAdapter`);

const isHttps = /https:?/;

const httpAdapter = <T = any>(config: RequestConfigNode) =>
  new Observable((observer: Observer<HttpEvent<T>>) => {
    const { emitError, emitComplete } = getObserverHandler(observer);
    let transportRequest: http.ClientRequest;

    const tearDown = () => {
      log.debug(`Teardown subscription`);
      if (!transportRequest || transportRequest.aborted) {
        return;
      }

      log.info(`Try to abort existing transport`);
      transportRequest.abort();
    };

    let data = config.data;
    const { proxy, headers = {}, maxContentLength, url: configUrl, method, maxRedirects } = config;

    if (!configUrl || !method) {
      emitError(createError(`Invalid request configuration`));
      return tearDown;
    }

    // Set User-Agent (required by some servers)
    // Only set header if it hasn't been set in config
    if (!headers['User-Agent'] && !headers['user-agent']) {
      log.debug(`Supplied header does not include 'User-Agent', attaching default value`);
      headers['User-Agent'] = `oxid/${oxidVersion}`;
    }

    if (data && !isStream(data)) {
      log.debug(`Request attached body data to send, but it is not stream type`);
      if (Buffer.isBuffer(data)) {
        // Noop, nothing to do
        log.debug(`Body data is stream, do not do anything`);
      } else if (isArrayBuffer(data)) {
        log.debug(`Body data is arraybuffer`);
        //https://github.com/nodejs/node/issues/14118#issuecomment-313933800,
        //Buffer.from accepts Uint8Array but type doesn't reflect it
        data = Buffer.from(new Uint8Array(data) as any);
      } else if (isString(data)) {
        log.debug(`Body data is string`);
        data = Buffer.from(data, 'utf-8');
      } else {
        emitError(
          createError('Data after transformation must be a string, an ArrayBuffer, a Buffer, or a Stream', config)
        );
        return tearDown;
      }

      // Add Content-Length header if data exists
      headers['Content-Length'] = data.length;
      log.debug(`Set header 'Content-Length'`, { length: data.length });
    }

    // HTTP basic authentication
    let auth = undefined;
    if (config.auth) {
      const username = config.auth.username || '';
      const password = config.auth.password || '';
      auth = username + ':' + password;
      log.debug(`Setting auth via basic auth configuration`, { username });
    }

    // Parse url
    const parsed = url.parse(configUrl);
    const protocol = parsed.protocol || 'http:';

    if (!auth && parsed.auth) {
      const urlAuth = parsed.auth.split(':');
      const urlUsername = urlAuth[0] || '';
      const urlPassword = urlAuth[1] || '';
      auth = urlUsername + ':' + urlPassword;
      log.debug(`Setting auth via url`, { urlUsername });
    }

    if (auth && !!headers.Authorization) {
      delete headers.Authorization;
      log.info(`Auth credential configured, ignoring authorization header`);
    }

    const isHttpsRequest = isHttps.test(protocol);
    const agent = isHttpsRequest ? config.httpsAgent : config.httpAgent;
    log.debug(`Requested protocol is ${isHttpsRequest ? 'https' : 'http'}`);
    log.debug(`Using agent`, agent);

    const options: any = {
      path: buildURL(parsed.path!, config.params, config.paramsSerializer).replace(/^\?/, ''),
      method: method.toUpperCase(),
      headers,
      agent: agent,
      auth: auth
    };

    if (config.socketPath) {
      options.socketPath = config.socketPath;
      log.debug(`Assigning socketPath to configuration`);
    } else {
      options.hostname = parsed.hostname;
      options.port = parsed.port;
      log.debug(`Assigning host to configuration`);
    }

    if (proxy) {
      options.hostname = proxy.host;
      options.host = proxy.host;
      options.headers.host = parsed.hostname + (parsed.port ? ':' + parsed.port : '');
      options.port = proxy.port;
      options.path = protocol + '//' + parsed.hostname + (parsed.port ? ':' + parsed.port : '') + options.path;

      log.debug(`Assigning proxy configuration`);
      // Basic proxy authorization
      if (proxy.auth) {
        const base64 = Buffer.from(`${proxy.auth.username}:${proxy.auth.password}`, 'utf8').toString('base64');
        options.headers['Proxy-Authorization'] = 'Basic ' + base64;
        log.debug(`Setting auth for proxy via 'Proxy-Authorization' header`);
      }
    }

    let transport: { request: typeof import('http').request };
    const isHttpsProxy = isHttpsRequest && (proxy ? isHttps.test(proxy.protocol || 'http') : true);
    log.debug(`Configured to use https proxy`, isHttpsProxy);

    if (config.transport) {
      transport = config.transport as any;
      log.debug(`Using transport specified in configuration, default transport will be ignored`);
    } else if (Number.isSafeInteger(maxRedirects!) && maxRedirects! > 0) {
      options.maxRedirects = maxRedirects;
      transport = isHttpsProxy ? httpsFollow : httpFollow;
      log.debug(`Redirection configured, using  `, maxRedirects);
    } else {
      transport = isHttpsProxy ? https : http;
      log.debug(`Using default transport`);
    }

    log.debug(`Transport`, transport!);

    if (maxContentLength && maxContentLength > -1) {
      options.maxBodyLength = maxContentLength;
      log.debug(`Setting max content length`, maxContentLength);
    }

    log.info(`Creating 'http.ClientRequest'`);
    log.debug(`With constructed options`, {
      ...options,
      auth: options.auth ? '********' : undefined,
      headers: options.headers['Proxy-Authorization'] ? {
        ...options.headers,
        ['Proxy-Authorization']: '********'
      } : options.headers
    });

    // Create the request
    transportRequest = transport.request(options, res => {
      if (transportRequest.aborted) {
        //TODO: should it error?
        return;
      }

      // uncompress the response body transparently if required
      let stream = res;
      switch (res.headers['content-encoding']) {
        case 'gzip':
        case 'compress':
        case 'deflate':
          log.info(`Uncompressing body`, res.headers['content-encoding']);
          // add the unzipper to the body stream processing pipeline
          stream = stream.pipe<any>(zlib.createUnzip());

          // remove the content-encoding in order to not confuse downstream operations
          delete res.headers['content-encoding'];
          break;
      }

      // return the last request in case of redirects
      const lastRequest = (res as any).req || transportRequest;

      const response = {
        status: Number.isSafeInteger(res.statusCode!) ? res.statusCode : Number.NaN,
        statusText: res.statusMessage || '',
        headers: res.headers,
        config: config,
        request: lastRequest
      } as HttpResponse<any>;

      log.info(`Response received`);
      log.debug(`Response`, { ...response, config: undefined });

      if (config.responseType === ResponseType.Stream) {
        log.info(`Response type configured as stream, emitting response`);
        response.data = stream;
        emitComplete(response);
      } else {
        log.info(`Waiting resonse buffer`);
        const responseBuffer: Array<any> = [];
        stream.on('data', chunk => {
          responseBuffer.push(chunk);

          // make sure the content length is not over the maxContentLength if specified
          if (!!maxContentLength && maxContentLength > -1 && Buffer.concat(responseBuffer).length > maxContentLength) {
            emitError(createError(`maxContentLength size of ${maxContentLength} exceeded`, config, null, lastRequest));
          }
        });

        stream.on('error', err => {
          if (transportRequest.aborted) {
            log.warn(`Response buffer stream raised an error, but transport is already aborted. Do not emit error`);
            log.debug(`Error`, err);
            return;
          }

          emitError(enhanceError(err, config, null, lastRequest));
        });

        stream.on('end', () => {
          log.info(`Response buffer stream completed`);

          let responseData: any = Buffer.concat(responseBuffer.filter(x => !!x));
          if (config.responseType !== ResponseType.ArrayBuffer) {
            log.info(`Serialize respone to string via encoding`, config.responseEncoding);
            responseData = responseData.toString(config.responseEncoding);
          }

          const parsedBody =
            config.responseType === 'json' && isString(responseData)
              ? parseJsonResponse(response.status, responseData)
              : { ok: true, body: responseData };

          log.info(`Set response data`);
          log.debug(`Response data`, parsedBody);
          response.data = parsedBody.body;

          //This will raised as error regardless existence of `validateStatus`
          if (!parsedBody.ok) {
            emitError(createError('Response parse failed', config, response.statusText, transportRequest, response));
          } else {
            // Applying same normalization logic as xhr
            if (response.status === 0) {
              response.status = !!responseData ? 200 : 0;
              log.info(`${response.status !== 0 ? 'Response status is 0 but responsedata is included, normalize status code' : ''}`);
            }

            log.info(`Response completed, emitting complete`);
            // The full body has been received and delivered, no further events
            // are possible. This request is complete.
            emitComplete(response);
          }
        });
      }
    });

    // Handle errors
    transportRequest.on('error', err => {
      if (transportRequest.aborted) {
        log.warn(`transportRequest raised an error, but already aborted. Do not emit error`);
        log.debug(`Error`, err);
        return;
      }

      emitError(enhanceError(err, config, null, transportRequest));
    });

    // Fire the request, and notify the event stream that it was fired.
    if (isStream(data)) {
      data.on('error', err => emitError(enhanceError(err, config, null, transportRequest))).pipe(transportRequest);
    } else {
      transportRequest.end(data);
    }
    log.info(`Transport request triggered`);
    observer.next({ type: HttpEventType.Sent });

    return tearDown;
  });

export { httpAdapter as adapter };
