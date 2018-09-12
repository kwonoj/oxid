import * as fs from 'fs';
import * as path from 'path';
import { version } from '../package.json';

/**
 * Naive script to generate metadata for oxid instead of import package.json directly
 */
(() => {
  let metadataVersion = null;
  try {
    //tslint:disable-next-line:no-require-imports
    metadataVersion = require('../src/metadata').oxidVersion;
  } catch (e) {
    //noop
  }

  if (version !== metadataVersion) {
    const template = `const oxidVersion = '${version}';
export {
  oxidVersion
};
`;
    fs.writeFileSync(path.resolve(__dirname, '../src/metadata.ts'), template);
  }
})();
