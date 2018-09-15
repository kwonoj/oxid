module.exports = () => ({
  files: [
    'package.json',
    'src/**/*.ts',
    { pattern: 'spec/__fixture__/**/*', instrument: false, load: true },
    { pattern: 'dist/**/*', ignore: true }
  ],
  tests: ['spec/**/*-spec.ts'],

  env: {
    type: 'node'
  }
});
