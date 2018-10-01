import { isFunction } from './base';

type logFunctionType = (message: string, ...optionalParams: Array<any>) => void;

interface Logger {
  debug: logFunctionType;
  info: logFunctionType;
  warn: logFunctionType;
  error: logFunctionType;
}

/**
 * noop fn for default log behavior.
 */
const noopLog: any = () => {
  //noop
};

/**
 * logger object for oxid.
 * This does noop by default unless explicitly specifiying logger object via `enableLogger`
 */
const log: Readonly<Logger> = {
  debug: noopLog,
  info: noopLog,
  warn: noopLog,
  error: noopLog
};

/**
 * Returns augumented logger object with namespace.
 *
 * @internal
 */
const getLogger = (identifier: string): Logger => {
  return Object.keys(log).reduce(
    (acc, key) => {
      acc[key] = function(message: string, ...args: Array<any>) {
        log[key](`oxid:${identifier}::${message}`, ...args);
      };
      return acc;
    },
    {} as any
  );
};

/**
 * Set logger for prints out internal behavior.
 * @param {logFunctionType | Partial<Logger>} logger Logger object contains loglevel function (debug, info, warn, error)
 * or single function to log. If single function is provided, all loglevel will use given function.
 * If logger object is partially implements logger, only available loglevel will be written.
 */
function enableLogger(logger: logFunctionType): void;
function enableLogger(logger: Partial<Logger>): void;
function enableLogger(logger: logFunctionType | Partial<Logger>) {
  const isLogFunction = isFunction(logger);

  //if logger is fn, assign to all loglevel. If logger is partial object, assign available logger or fall back to noop.
  Object.keys(log).forEach(key => (log[key] = isLogFunction ? logger : logger[key] || noopLog));
}

export { logFunctionType, Logger, enableLogger, getLogger };
