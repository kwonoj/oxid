import { Observer } from 'rxjs';
import { HttpEvent, HttpEventType, HttpResponse } from '../Response';
import { createError } from './createError';

const getObserverHandler = (observer: Observer<any>) => {
  let handled = false;
  return {
    /**
     * Emit next httpEvent, unlike `emitComplete`, this neither verify status nor completes.
     */
    emitNext: <T = any>(response: HttpEvent<T>) => {
      if (handled) {
        return;
      }
      observer.next(response);
    },
    emitError: (err: any) => {
      if (handled) {
        return;
      }
      handled = true;
      observer.error(err);
    },
    /**
     * Error or next response based on status. Once response emitted via next,
     * it'll complete as well.
     *
     * @param observer
     * @param response
     */
    emitComplete: <T = any>(response: HttpResponse<T>) => {
      if (handled) {
        return;
      }
      handled = true;
      const validateStatus = response.config.validateStatus;

      if (!validateStatus || validateStatus(response.status)) {
        observer.next({
          ...response,
          type: HttpEventType.Response
        });
        observer.complete();
      } else {
        observer.error(
          createError(
            `Request failed with status code ${response.status}`,
            response.config,
            null,
            response.request,
            response
          )
        );
      }
    }
  };
};

export { getObserverHandler };
