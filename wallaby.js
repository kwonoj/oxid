module.exports = () => ({
  files: ['src/**/*.ts', 'jest.json', { pattern: 'dist/**/*', ignore: true }],
  tests: ['spec/**/*-spec.ts'],
  testFramework: {
    type: 'jest'
  },
  env: {
    type: 'node'
  },
  setup: wallaby => {
    const { testEnvironment } = require('./jest.json');
    wallaby.testFramework.configure({
      testEnvironment
    });
  }
});
