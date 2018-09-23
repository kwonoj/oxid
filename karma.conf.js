const webpack = require('webpack');

module.exports = function(config) {
  config.set({
    frameworks: ['mocha'],
    basePath: '',
    files: [{ pattern: 'src/**/*.ts', watched: false }, { pattern: 'spec/**/*.ts', watched: false }],
    exclude: ['src/ambient.d.ts'],
    preprocessors: {
      '**/*.ts': ['webpack']
    },
    mime: {
      'text/x-typescript': ['ts', 'tsx']
    },
    webpack: {
      mode: 'development',
      resolve: {
        extensions: ['.ts', '.js']
      },
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.base.json'
            }
          }
        ]
      },
      plugins: [
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new (require('rewiremock/webpack/plugin'))()
      ]
    },
    webpackMiddleware: {
      stats: 'errors-only'
    },
    reporters: ['progress'],
    browsers: ['ChromeHeadless']
  });
};
