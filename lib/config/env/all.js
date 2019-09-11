'use strict';

var path = require('path');

// determine the path of the folder where server.js lives (go backwards from lib/config/env)
var rootPath = path.normalize(__dirname + '/../../..');

module.exports = {

  // the port on which Codeboard runs
  port: process.env.PORT || 3000,

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
      db: {
        safe: true
      },
      user: process.env.MONGO_DB_USER || 'mongoUser',
      pass: process.env.MONGO_DB_PASSWORD || 'mongoPassword'
    }
  },

  codeboard: {
    // protocol and hostname that's presented when announcing a WebSocket address (e.g. to connect to a container)
    wsHostname: 'ws://localhost:9000'
  },

  // settings of the Mantra service (for compiling and running programs)
  mantra: {
    // Mantra is our service
    ip: '127.0.0.1',
    url: 'http://127.0.0.1',
    port: 9090,
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

  // todo: configuration for nodemailer as used in mailSrv (to send welcome email, email password reset etc.)
  // list of pre-configured services: https://github.com/andris9/nodemailer-wellknown#supported-services
  email: {
    service: '', // e.g. Gandi
    user: '', // e.g. myUser
    password: '', // e.g. s3%$#@#%34zJL53

    // the email address from which emails are send (welcome email, password reset email)
    // this address will show as the sender of the email
    defaultEmail: 'Open-Codeboard Info <info@open.codeboard.io>'
  },

  // configuration for session data
  sessionSettings: {
    name: 'codeboard',
    secret: 'evmdoaafxeosuqsifcpnbmdhvxeam',

    // we persisted sessions using Mongo database (except when testing)
    mongoStoreDbName: 'codeboardSession'
  }
};
