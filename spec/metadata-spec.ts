import { expect } from 'chai';

import { oxidVersion } from '../src/metadata';
const { version } = require('../package.json'); //tslint:disable-line:no-require-imports no-var-requires

describe('metadata', () => {
  it(`should match with package version`, () => {
    expect(version).to.equal(oxidVersion);
  });
});
