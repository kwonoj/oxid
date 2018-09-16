module.exports = () => ({
  files: [
    'package.json',
    'src/**/*.ts',
    { pattern: 'spec/__fixtures__/**/*', instrument: false, load: true },
    { pattern: 'spec/__mocks__/**/*', instrument: false, load: true },
    { pattern: 'dist/**/*', ignore: true }
  ],
  tests: ['spec/**/*-spec.ts'],

  env: {
    type: 'node'
  }
});
