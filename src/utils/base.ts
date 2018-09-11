import { root } from 'getroot';

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
const isDate = (val: any) => !!val && !!val.toString && val.toString() === '[object Date]';

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

export { isObject, isDate, isURLSearchParams };
