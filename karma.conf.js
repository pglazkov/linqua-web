// Karma configuration file, see link for more information
// https://karma-runner.github.io/0.13/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular/cli'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-mocha-reporter'),      
      require('@angular/cli/plugins/karma')
    ],
    client:{
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    files: [
      { pattern: './src/client/test.ts', watched: false }
    ],
    preprocessors: {
      './src/client/test.ts': ['@angular/cli']
    },
    mime: {
      'text/x-typescript': ['ts','tsx']
    },
    angularCli: {
      environment: 'dev'
    },
    reporters: ['kjhtml', 'mocha'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_WARN,
    autoWatch: false,
    browsers: [
      'ChromeWithDebug'
    ],
    customLaunchers: {
      ChromeWithDebug: {
        base: 'Chrome',
        flags: ['--remote-debugging-port=9223']
      }
    },
    singleRun: true
  });
};
