// Karma configuration
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function(config) {
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    // testing framework to use (jasmine/mocha/qunit/...)
    frameworks: ['mocha', 'chai'],

    // Note: we use chai for assertions because it allows for
    // assertions in should.js expect.js and assert.js style.
    // However, all tests should use should.js style assertions

    // list of files / patterns to load in the browser
    files: [
      // Karma dependencies to have Angular running and e.g. injection working
      'app/bower_components/jquery/dist/jquery.js',
      'app/bower_components/angular/angular.js',
      'app/bower_components/angular-mocks/angular-mocks.js',

      // jsSHA
      'app/bower_components/jsSHA/src/sha.js',

      /** Karma dependencies because of directives used in app.js */

      'app/bower_components/angular-cookies/angular-cookies.js',
      'app/bower_components/angular-resource/angular-resource.js',
      'app/bower_components/angular-sanitize/angular-sanitize.js',
      'app/bower_components/angular-route/angular-route.js',
      'app/bower_components/angular-animate/angular-animate.js',

      // ui.ace
      'app/bower_components/ace-builds/src/ace.js',
      'app/bower_components/angular-ui-ace/ui-ace.js',
      // angularTreeview
      'app/components/angularTreeview/angular.treeview.js',
      // bootstrap
      'app/bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
      // angularFileUpload
      'app/bower_components/ng-file-upload-shim/angular-file-upload-shim.js',
      'app/bower_components/ng-file-upload/angular-file-upload.js',
      // ui.select
      'app/bower_components/angular-ui-select/dist/select.js',
      // ngGrid
      'app/bower_components/ng-grid/ng-grid-2.0.13.min.js',
      // kendo.directives
      'app/bower_components/kendo-ui/js/kendo.core.min.js',
      'app/bower_components/kendo-ui/js/kendo.ui.core.min.js',
      'app/bower_components/kendo-ui/js/kendo.angular.min.js',
      // chart.js
      'app/bower_components/Chart.js/Chart.min.js',
      'app/bower_components/angular-chart.js/dist/angular-chart.js',
      // ngWebSocket
      'app/bower_components/angular-websocket/angular-websocket.js',
      // luegg.directives
      'app/bower_components/angular-scroll-glue/src/scrollglue.js',

      /** End of Karma dependencies because of directives used in app.js */


      'app/scripts/*.js',
      'app/scripts/**/*.js',
      'test/client/mock/**/*.js',
      'test/client/spec/**/*.js'

    ],

    // list of files / patterns to exclude
    exclude: [],

    // web server port
    port: 9876,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,


    // outputs to the console should be printed
    client: {
      captureConsole: true,
      mocha: {
        bail: true
      }
    },

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
};
