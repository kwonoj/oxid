import * as path from 'path';
import * as webpack from 'webpack';

module.exports = (config: { set: (config: object) => void }) => {
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
      devtool: 'inline-source-map',
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
          },
          {
            test: /\.ts$/,
            exclude: [path.resolve(__dirname, 'spec')],
            enforce: 'post',
            use: {
              loader: 'istanbul-instrumenter-loader',
              options: { esModules: true }
            }
          }
        ]
      },
      plugins: [
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new (require('rewiremock/webpack/plugin'))() //tslint:disable-line:no-require-imports
      ]
    },
    webpackMiddleware: {
      stats: 'errors-only'
    },
    reporters: ['progress', 'coverage-istanbul'],
    browsers: ['ChromeHeadless'],
    coverageIstanbulReporter: {
      reports: ['json'],
      dir: path.join(__dirname, 'coverage', 'karma'),
      fixWebpackSourcePaths: true
    }
  });
};
