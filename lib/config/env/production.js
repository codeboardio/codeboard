'use strict';

module.exports = {

  env: 'production',

  envFolder: 'public',

  db: {
    database: 'codeboard'
  },

  mongo: {
    uri: 'mongodb://localhost/codeboardLogs'
  },

  codeboard: {
    // because we use https in production, we also need to use wss
    wsHostname: 'wss://codeboard.io'
  },

  mantra : {
    ip: '127.0.0.1',
    url: 'http://127.0.0.1',
    port: 9090
  },

  kali: {
    url: 'http://127.0.0.1',
    port: 9091
  },

  tara: {
    url: 'http://127.0.0.1',
    port: 9090
  }

};
