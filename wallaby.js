module.exports = _wallaby => ({
  files: ['src/**/*.ts'],

  tests: ['spec/**/*-spec.ts'],

  testFramework: {
    type: 'jest'
  },

  env: {
    type: 'node'
  }
});
