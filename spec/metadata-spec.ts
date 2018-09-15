import { expect } from 'chai';

import { version } from '../package.json';
import { oxidVersion } from '../src/metadata';

describe('metadata', () => {
  it(`should match with package version`, () => {
    expect(version).to.equal(oxidVersion);
  });
});
