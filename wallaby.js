module.exports = wallaby => ({
  files: ['src/**/*.ts', { pattern: 'spec/**/!(*-spec).ts', instrument: false, load: true }],

  tests: ['spec/**/*-spec.ts'],

  testFramework: {
    type: 'jest'
  },

  env: {
    type: 'node'
  },

  workers: {
    initial: 1,
    regular: 1
  }
});
