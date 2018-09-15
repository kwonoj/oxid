import * as chai from 'chai';
import { expect } from 'chai';

let imported = false;
(() => {
  if (!imported) {
    const subset = require('chai-subset'); //tslint:disable-line:no-require-imports no-var-requires
    chai.use(subset);

    imported = true;
  }
})();

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

const describeOnly = {
  node: isBrowser ? describe.skip : describe,
  browser: isBrowser ? describe : describe.skip
};

const itOnly = {
  node: isBrowser ? it.skip : it,
  browser: isBrowser ? it : it.skip
};

export { describeOnly, itOnly, expect };
