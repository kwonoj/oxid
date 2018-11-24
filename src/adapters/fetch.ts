import { Observable, Observer } from 'rxjs';
import { RequestConfigFetch } from '../Request';
import { HttpEvent } from '../Response';
import { isFormData } from '../utils/base';
import { createError } from '../utils/createError';
import { getObserverHandler } from '../utils/getObserverHandler';
import { getLogger } from '../utils/log';
import { fetchBackend } from './fetchBackend';

const log = getLogger(`fetchAdapter`);

const fetchAdapter = <T = any>(config: RequestConfigFetch) =>
  new Observable((observer: Observer<HttpEvent<T>>) => {
    const { withCredentials } = config;
    const { emitError, emitComplete } = getObserverHandler(observer);
    const { fetch, abortController } = fetchBackend();

    const abortCtrl = new abortController();
    const { signal } = abortCtrl;

    // This is the return from the Observable function, which is the
    // request cancellation handler.
    const tearDown = () => {
      log.debug(`Teardown subscription`);

      abortCtrl.abort();
    };

    if (!config.url || !config.method) {
      emitError(createError(`Invalid request configuration`));
      return tearDown;
    }

    const requestData = config.data;
    const requestHeaders = config.headers || {};

    if (isFormData(requestData)) {
      log.debug(`Requested data is form, remove 'Content-Type' header and let browser set it accordingly`);
      delete requestHeaders['Content-Type']; // Let the browser set it
    }

    // HTTP basic authentication
    if (config.auth) {
      const username = config.auth.username || '';
      const password = config.auth.password || '';
      requestHeaders.Authorization = 'Basic ' + btoa(`${username}:${password}`);
      log.debug(`Setting auth via basic auth configuration, setting 'Authorization' header`, { username });
    }

    /*
    interface RequestInit {
    body?: BodyInit | null;
    cache?: RequestCache;
    credentials?: RequestCredentials;
    headers?: HeadersInit;
    integrity?: string;
    keepalive?: boolean;
    method?: string;
    mode?: RequestMode;
    redirect?: RequestRedirect;
    referrer?: string;
    referrerPolicy?: ReferrerPolicy;
    signal?: AbortSignal | null;
    window?: any;
}*/
    const requestInit = {
      signal
    };

    fetch(config.url, requestInit);

    //https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    /*fetch(null, {
      signal
    }).then((res) => {

    }).catch((reason) => {
      if (reason.name === 'AbortError') {
        log.info(`Request has aborted`);
        emitError(createError('Request aborted', config, 'ECONNABORTED'))
      } else {
      }
    });*/

    return tearDown;
  });

export { fetchAdapter as adapter };
