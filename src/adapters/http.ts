import { http as httpFollow } from 'follow-redirects';
import { https as httpsFollow } from 'follow-redirects';
import * as http from 'http';
import * as https from 'https';
import { Observable, Observer } from 'rxjs';
import * as url from 'url';
import * as zlib from 'zlib';

import { isString } from 'util';
import { oxidVersion } from '../metadata';
import { OxidResponse } from '../Response';
import { isArrayBuffer, isStream } from '../utils/base';
import { createError, enhanceError } from '../utils/createError';
import { getObserverHandler } from '../utils/getObserverHandler';
import { buildURL } from '../utils/urls';

const isHttps = /https:?/;

const httpadapter = (config: any) =>
  //TODO: Observable type need to be defined
  //TODO: prevent to error/next/complete if any occurred (wrapper fn)
  //TODO: enhance check around !
  new Observable((observer: Observer<any>) => {
    const { emitError, emitComplete } = getObserverHandler(observer);
    let data = config.data;
    let headers = config.headers;

    // Set User-Agent (required by some servers)
    // Only set header if it hasn't been set in config
    if (!headers['User-Agent'] && !headers['user-agent']) {
      headers['User-Agent'] = `oxid/${oxidVersion}`;
    }

    if (data && !isStream(data)) {
      if (Buffer.isBuffer(data)) {
        // Noop, nothing to do
      } else if (isArrayBuffer(data)) {
        data = Buffer.from(new Uint8Array(data));
      } else if (isString(data)) {
        data = Buffer.from(data, 'utf-8');
      } else {
        emitError(
          createError('Data after transformation must be a string, an ArrayBuffer, a Buffer, or a Stream', config)
        );
      }

      // Add Content-Length header if data exists
      headers['Content-Length'] = data.length;
    }

    // HTTP basic authentication
    let auth = undefined;
    if (config.auth) {
      let username = config.auth.username || '';
      let password = config.auth.password || '';
      auth = username + ':' + password;
    }

    // Parse url
    let parsed = url.parse(config.url);
    let protocol = parsed.protocol || 'http:';

    if (!auth && parsed.auth) {
      let urlAuth = parsed.auth.split(':');
      let urlUsername = urlAuth[0] || '';
      let urlPassword = urlAuth[1] || '';
      auth = urlUsername + ':' + urlPassword;
    }

    if (auth) {
      delete headers.Authorization;
    }

    let isHttpsRequest = isHttps.test(protocol);
    let agent = isHttpsRequest ? config.httpsAgent : config.httpAgent;

    let options: any = {
      path: buildURL(parsed.path!, config.params, config.paramsSerializer).replace(/^\?/, ''),
      method: config.method.toUpperCase(),
      headers: headers,
      agent: agent,
      auth: auth
    };

    if (config.socketPath) {
      options.socketPath = config.socketPath;
    } else {
      options.hostname = parsed.hostname;
      options.port = parsed.port;
    }

    let proxy = config.proxy;
    if (!proxy && proxy !== false) {
      let proxyEnv = protocol.slice(0, -1) + '_proxy';
      let proxyUrl = process.env[proxyEnv] || process.env[proxyEnv.toUpperCase()];
      if (proxyUrl) {
        let parsedProxyUrl = url.parse(proxyUrl);
        let noProxyEnv = process.env.no_proxy || process.env.NO_PROXY;
        let shouldProxy = true;

        if (noProxyEnv) {
          let noProxy = noProxyEnv.split(',').map(function trim(s) {
            return s.trim();
          });

          shouldProxy = !noProxy.some(function proxyMatch(proxyElement) {
            if (!proxyElement) {
              return false;
            }
            if (proxyElement === '*') {
              return true;
            }

            const parsedHostname = parsed.hostname;
            if (
              proxyElement[0] === '.' &&
              !!parsedHostname &&
              parsedHostname.substr(parsedHostname.length - proxyElement.length) === proxyElement &&
              proxyElement.match(/\./g)!.length === parsedHostname.match(/\./g)!.length
            ) {
              return true;
            }

            return parsed.hostname === proxyElement;
          });
        }

        if (shouldProxy) {
          proxy = {
            host: parsedProxyUrl.hostname,
            port: parsedProxyUrl.port
          };

          if (parsedProxyUrl.auth) {
            let proxyUrlAuth = parsedProxyUrl.auth.split(':');
            proxy.auth = {
              username: proxyUrlAuth[0],
              password: proxyUrlAuth[1]
            };
          }
        }
      }
    }

    if (proxy) {
      options.hostname = proxy.host;
      options.host = proxy.host;
      options.headers.host = parsed.hostname + (parsed.port ? ':' + parsed.port : '');
      options.port = proxy.port;
      options.path = protocol + '//' + parsed.hostname + (parsed.port ? ':' + parsed.port : '') + options.path;

      // Basic proxy authorization
      if (proxy.auth) {
        let base64 = Buffer.from(proxy.auth.username + ':' + proxy.auth.password, 'utf8').toString('base64');
        options.headers['Proxy-Authorization'] = 'Basic ' + base64;
      }
    }

    let transport: { request: typeof import('http').request };
    let isHttpsProxy = isHttpsRequest && (proxy ? isHttps.test(proxy.protocol) : true);
    if (config.transport) {
      transport = config.transport;
    } else if (config.maxRedirects === 0) {
      transport = isHttpsProxy ? https : http;
    } else {
      if (config.maxRedirects) {
        options.maxRedirects = config.maxRedirects;
      }
      transport = isHttpsProxy ? httpsFollow : httpFollow;
    }

    if (config.maxContentLength && config.maxContentLength > -1) {
      options.maxBodyLength = config.maxContentLength;
    }

    // Create the request
    let req = transport.request(options, function handleResponse(res) {
      if (req.aborted) {
        return;
      }

      // uncompress the response body transparently if required
      let stream = res;
      switch (res.headers['content-encoding']) {
        case 'gzip':
        case 'compress':
        case 'deflate':
          // add the unzipper to the body stream processing pipeline
          stream = stream.pipe<any>(zlib.createUnzip());

          // remove the content-encoding in order to not confuse downstream operations
          delete res.headers['content-encoding'];
          break;
      }

      // return the last request in case of redirects
      let lastRequest = (res as any).req || req;

      let response = {
        status: res.statusCode || Number.NaN,
        statusText: res.statusMessage || '',
        headers: res.headers,
        config: config,
        request: lastRequest
      } as OxidResponse<any>;

      if (config.responseType === 'stream') {
        response.data = stream;
        emitComplete(response);
      } else {
        const responseBuffer: Array<any> = [];
        stream.on('data', function handleStreamData(chunk) {
          responseBuffer.push(chunk);

          // make sure the content length is not over the maxContentLength if specified
          if (config.maxContentLength > -1 && Buffer.concat(responseBuffer).length > config.maxContentLength) {
            emitError(
              createError(
                'maxContentLength size of ' + config.maxContentLength + ' exceeded',
                config,
                null,
                lastRequest
              )
            );
          }
        });

        stream.on('error', function handleStreamError(err) {
          if (req.aborted) {
            return;
          }
          emitError(enhanceError(err, config, null, lastRequest));
        });

        stream.on('end', function handleStreamEnd() {
          let responseData: any = Buffer.concat(responseBuffer);
          if (config.responseType !== 'arraybuffer') {
            responseData = responseData.toString(config.responseEncoding);
          }

          response.data = responseData;
          emitComplete(response);
        });
      }
    });

    // Handle errors
    req.on('error', function handleRequestError(err) {
      if (req.aborted) {
        return;
      }
      emitError(enhanceError(err, config, null, req));
    });

    // Send the request
    if (isStream(data)) {
      data.on('error', err => emitError(enhanceError(err, config, null, req))).pipe(req);
    } else {
      req.end(data);
    }

    // This is the return from the Observable function, which is the
    // request cancellation handler.
    return () => {
      if (req.aborted) {
        return;
      }
      req.abort();
    };
  });

export { httpadapter as adapter };
