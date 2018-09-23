import { isURLSearchParams as isURLSearchParamsBrowser } from '../browser/isURLSearchParams';

const isURLSearchParams = (val: unknown) => {
  //tslint:disable-next-line:no-require-imports
  const urlCtor = require('url').URLSearchParams;
  const urlCtorDefined = typeof urlCtor !== 'undefined';

  return isURLSearchParamsBrowser(val) || (urlCtorDefined && val instanceof urlCtor);
};

export { isURLSearchParams };
