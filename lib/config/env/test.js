'use strict';

module.exports = {

  env: 'test',

  envFolder: 'app',

  db: {
    database: 'codeboard-test'
  },

  mongo: {
    uri: 'mongodb://localhost/codeboardLogs-test'
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
