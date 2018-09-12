import { Observer } from 'rxjs';
import { OxidResponse } from '../Response';
import { createError } from './createError';

/**
 * Error or next response based on status. Once response emitted via next,
 * it'll complete as well.
 *
 * @param observer
 * @param response
 */
//TODO: Observable type need to be defined
const completeObservable = (observer: Observer<any>, response: OxidResponse<any>) => {
  const validateStatus = response.config.validateStatus;

  if (!validateStatus || validateStatus(response.status)) {
    observer.next(response);
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
};

export { completeObservable };
