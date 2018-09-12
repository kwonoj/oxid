import { root } from 'getroot';

const toPrototypeString = (val: any) => Object.prototype.toString.call(val);

/**
 * Naïvely detect if running environment if node
 * Note this'll return true on Electron's renderer process as well
 */
const isNode = () => {
  const proc = root.process;

  if (!!proc && typeof proc === 'object') {
    if (!!proc.versions && typeof proc.versions === 'object') {
      if (typeof proc.versions.node !== 'undefined') {
        return true;
      }
    }
  }
  return false;
};

/**
 * Determine if a value is a String
 *
 * @param {any} val The value to test
 * @returns {boolean} True if value is a String, otherwise false
 */
const isString = (val: any): val is String => typeof val === 'string';

/**
 * Determine if a value is a Number
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Number, otherwise false
 */
const isNumber = (val: any): val is number => typeof val === 'number';

/**
 * Determine if a value is an Object
 *
 * @param unknown val The value to test
 * @returns boolean True if value is an Object, otherwise false
 */
const isObject = (val: unknown) => val !== null && typeof val === 'object';

/**
 * Determine if a value is a Date
 *
 * @param any val The value to test
 * @returns boolean True if value is a Date, otherwise false
 */
const isDate = (val: any): val is Date => !!val && !!val.toString && toPrototypeString(val) === '[object Date]';

/**
 * Determine if a value is a URLSearchParams object
 *
 * @param unknown val The value to test
 * @returns boolean True if value is a URLSearchParams object, otherwise false
 */
const isURLSearchParams = (val: unknown) => {
  //tslint:disable-next-line:no-require-imports
  const urlCtor = isNode() ? require('url').URLSearchParams : undefined;
  const urlCtorDefined = typeof urlCtor !== 'undefined';
  const rootCtor = root.URLSearchParams;
  const rootCtorDefined = typeof rootCtor !== 'undefined';

  return (rootCtorDefined && val instanceof rootCtor) || (isNode() ? urlCtorDefined && val instanceof urlCtor : false);
};

/**
 * Determine if we're running in a standard browser environment
 *
 * This allows axios to run in a web worker, and react-native.
 * Both environments support XMLHttpRequest, but not fully standard globals.
 *
 * web workers:
 *  typeof window -> undefined
 *  typeof document -> undefined
 *
 * react-native:
 *  navigator.product -> 'ReactNative'
 * nativescript
 *  navigator.product -> 'NativeScript' or 'NS'
 */
const isStandardBrowserEnv = () => {
  if (
    typeof navigator !== 'undefined' &&
    (navigator.product === 'ReactNative' || navigator.product === 'NativeScript' || navigator.product === 'NS')
  ) {
    return false;
  }
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

export { isString, isObject, isNumber, isDate, isURLSearchParams, isStandardBrowserEnv };
