'use strict';

var express = require('express'),
  path = require('path'),
  fs = require('fs'),
  bodyParser = require('body-parser'),
  util = require('util'),
  expressValidator = require('express-validator'),
  session = require('express-session'),
  mongoStore = require('connect-mongo')(session),
  passport = require('passport'),
  compression = require('compression'),
  busboy = require('connect-busboy'),
  httpProxy = require('http-proxy'),
  url = require('url'),
  config = require('./lib/config/config.js');

/**
 * Main application file
 *
 * Note: consider storing express settings in a separate file: require('./lib/config/express')(app);
 */

// Set default node environment to development
var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// get an express instance
var app = express();



if (env == 'development') {
  app.use(require('connect-livereload')());

  // Disable caching of scripts for easier testing
  app.use(function noCache(req, res, next) {
    if (req.url.indexOf('/scripts/') === 0) {
      res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.header('Pragma', 'no-cache');
      res.header('Expires', 0);
    }
    next();
  });

  app.use(express.static(path.join(config.root, '.tmp')));
  app.use(express.static(path.join(config.root, 'app')));
  //app.use(express.static(path.join(config.root, ''));


  app.set('views', config.root + '/app/views');
}

if(env == 'production') {

  var compression = require('compression');

  app.use(compression());
  app.use(express.static(path.join(config.root, 'public')));
  app.set('views', config.root + '/views');
}



app.use(busboy());
app.use(bodyParser({limit: '10mb'}));
app.use(expressValidator());


app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');


// set configuration for settings
if (env !== 'test') {
  // by default we persist sessions using the Mongo database
  app.use(session(
    {
      name: config.sessionSettings.name,
      secret: config.sessionSettings.secret,
      cookie: {maxAge: 30 * 24 * 60 * 60 * 1000}, // session expires after 30 days (unit is ms)
      resave: true,
      saveUninitialized: true,
      store: new mongoStore({db: config.sessionSettings.mongoStoreDbName, clear_interval: 6 * 3600}) // clear interval removes expired sessions every 6h (unit is sec)
    }
  ));
} else {
  // when testing we don't want to use the mongo store but in-memory store for sessions
  app.use(session(
    {
      name: config.sessionSettings.name,
      secret: config.sessionSettings.secret
    }
  ));
}


//use passport session
app.use(passport.initialize());
app.use(passport.session());
require('./lib/config/passport.js'); // configure passport & set strategy


// Create the server using app
var server = require('http').createServer(app);


// Create a proxy server that redirects WebSocket request directly to the Docker daemon.
var wsLoadBalancer = httpProxy.createProxyServer({target: 'ws://' + config.mantra.ip + ':' + config.mantra.port, changeOrigin: true});
// Intercept upgrade events (from http to WS) and forward the to docker daemon
server.on('upgrade', function(req, socket, head) {

  var urlObject = url.parse(req.url, true);
  var mantraNode = urlObject.query.mantra;

  req.headers['cookie'] = 'CoboMantraId=' + mantraNode;

  wsLoadBalancer.ws(req, socket, head);
});

// listen to error
wsLoadBalancer.on('error', function (err, req, res) {
  console.log('---\n' + (new Date(Date.now())).toLocaleString('en-US') + ' HTTP-Proxy Error:');
  console.log(err);
  console.log('---');
});


// load the routes only after setting static etc. Otherwise the files won't be served correctly
require('./lib/routes')(app);


var db = require('./lib/models');

if (env == 'development') {
  // Disable the foreign key constraints before trying to sync the models.
  // Otherwise, we're likely to violate a constraint while dropping a table.
  db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
    .spread(function(res, meta) {
      return db.sequelize.sync({force: false});
    })
    .then(function() {
      return db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    })
    .spread(function(res, meta) {
      if (false) {
        throw err[0]
      } else {
        server.listen(config.port, function () {

          // add the template projects to the db; note that this is an async operation
          var templateProjects = require('./lib/config/dbTemplateProjects.js');
          templateProjects.addAllTemplateProjects();

          console.log('Codeboard server listening on port %d in %s mode', config.port, app.get('env'));
        });
      }
    });
  }


if(env == 'production') {
  // start the server
  server.listen(config.port, function () {
    console.log('Codeboard server listening on port %d in %s mode', config.port, app.get('env'));
  });
}


// Expose app
module.exports = app;
