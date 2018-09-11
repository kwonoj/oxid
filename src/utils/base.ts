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
const isURLSearchParams = (val: unknown) => typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;

export { isObject, isDate, isURLSearchParams };
