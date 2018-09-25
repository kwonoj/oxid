import { Oxid } from './core/oxid';
import { defaultOptions } from './defaultOptions';
import { RequestConfig } from './Request';

export * from './core/oxid';
export * from './defaultOptions';
export * from './Request';
export * from './Response';
export * from './metadata';
export { logFunctionType, Logger, enableLogger } from './utils/log';

/**
 * Create an instance of Oxid, only wraps class ctor.
 */
const create = (config: RequestConfig = defaultOptions) => new Oxid(config);

/**
 * Default instance of oxid.
 */
const oxid = create();

export { create, oxid };
