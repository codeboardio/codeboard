'use strict';

var path = require('path');

// determine the path of the folder where server.js lives (go backwards from lib/config/env)
var rootPath = path.normalize(__dirname + '/../../..');

module.exports = {

  // the port on which Codeboard runs
  port: process.env.PORT || 3000,

  // host name (used to authenticate lti requests)
  host: process.env.HOST || 'http://localhost',

  // listenHost is used to specify which calls the application listens on
  listenHost: process.env.LISTEN_HOST || '0.0.0.0',

  // path to the root folder
  root: rootPath,

  // where to store users' profile pictures
  userProfileImagePath: 'images/users/profiles',

  // where the default user profile pictures are located
  userProfileDefaultImagePath:'images/users/defaults',

  db: {
    port: process.env.DB_PORT || '3306',
    host: process.env.DB_HOST || '127.0.0.1',
    username: process.env.DB_USER || 'mysqlUser',
    password: process.env.DB_PASSWORD || 'mysqlPassword'
  },

  mongo: {
    options: {
      user: process.env.MONGO_DB_USER || 'mongoUser',
      pass: process.env.MONGO_DB_PASSWORD || 'mongoPassword'
    }
  },

  codeboard: {
    // protocol and hostname that's presented when announcing a WebSocket address (e.g. to connect to a container)
    wsHostname: process.env.WS_HOSTNAME || 'ws://localhost:9000'
  },

  // settings of the Mantra service (for compiling and running programs)
  mantra : {
    ip: process.env.MANTRA_IP || '127.0.0.1',
    url: process.env.MANTRA_URL || 'http://127.0.0.1',
    port: process.env.MANTRA_PORT || 9090,
    cookieName: 'CoboMantraId'
  },

  // settings of the Kali service (for unit-testing programs)
  kali: {
    // Kali is our testing service
    url: 'http://127.0.0.1',
    port: 9091
  },

  // Tara is our tool service; might be the same physical server as Mantra
  tara: {
    url: 'http://127.0.0.1',
    port: 9090
  },

  // configuration for session data
  sessionSettings: {
    name: 'codeboard',
    secret: 'evmdoaafxeosuqsifcpnbmdhvxeam',

    // we persisted sessions using Mongo database (except when testing)
    mongoStoreDbName: 'codeboardSession'
  },

  // avatar settings
  avatarSettings: {
    name: "Roby",
    email: "roby@zhaw.ch"
  },

  // the url for the compilation error service (students work)
  compilationErrorSrv: 'http://localhost:80/api/getCompilationErrorMessage',

  storeCompilationErrors: false
};
