import { root } from 'getroot';
import { getLogger } from '../utils/log';

/**
 * When environment doesn't support abort controller, stubs out to allow fetch works without cancellation.
 */
class EmptyAbortController {
  constructor() {
    const log = getLogger(`fetchAdapter`);
    log.info(`Environment does not support abortController, cancellation will not work`);
  }
  public abort(): void {
    // noop
  }

  public get signal(): undefined {
    return undefined;
  }
}

/**
 * Naive factory to global fetch and abortController.
 */
const fetchBackend = () => ({ fetch, abortController: root.AbortController || EmptyAbortController });

export { fetchBackend };