import { isDate } from 'util';
import { isObject, isURLSearchParams } from './base';

const encode = (val: string) =>
  encodeURIComponent(val)
    .replace(/%40/gi, '@')
    .replace(/%3A/gi, ':')
    .replace(/%24/g, '$')
    .replace(/%2C/gi, ',')
    .replace(/%20/g, '+')
    .replace(/%5B/gi, '[')
    .replace(/%5D/gi, ']');

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {Record<string, any>} [params] The params to be appended
 * @param {(}params: Record<string, string>)} => string [paramsSerializer] custom serializer
 * @returns {string} The formatted url
 */
const buildURL = (
  url: string,
  params?: Record<string, any>,
  paramsSerializer?: (params: Record<string, any>) => string
): string => {
  if (!params) {
    return url;
  }

  const constructUrl = (serializedParams: string) => {
    if (!serializedParams) {
      return url;
    }

    const hashmarkIndex = url.indexOf('#');
    const sliced = url.indexOf('#') !== -1 ? url.slice(0, hashmarkIndex) : url;

    return `${sliced}${sliced.indexOf('?') === -1 ? '?' : '&'}${serializedParams}`;
  };

  if (paramsSerializer) {
    return constructUrl(paramsSerializer(params));
  } else if (isURLSearchParams(params)) {
    return constructUrl(params.toString());
  } else {
    //TODO: remove type casting when `Object.entries` supported in type definition
    const parts = ((Object as any).entries(params) as Array<[string, string]>)
      .filter(([, value]) => value !== null && typeof value !== 'undefined')
      .reduce(
        (acc, [key, value]) => {
          const [updatedKey, updatedValue]: [string, Array<string>] = Array.isArray(value)
            ? [`${key}[]`, value]
            : [key, [value]];
          const encoded = updatedValue.map(
            (v: string) =>
              `${encode(updatedKey)}=${encode(isDate(v) ? v.toISOString() : isObject(v) ? JSON.stringify(v) : v)}`
          );

          return acc.concat(encoded);
        },
        [] as Array<string>
      );

    return constructUrl(parts.join('&'));
  }
};

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
const combineURLs = (base: string, relative: string): string =>
  relative ? base.replace(/\/+$/, '') + '/' + relative.replace(/^\/+/, '') : base;

/**
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 *
 * A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
 * RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
 * by any combination of letters, digits, plus, period, or hyphen.
 */
const isAbsoluteURL = (url: string): boolean => /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);

export { buildURL, combineURLs, isAbsoluteURL };
