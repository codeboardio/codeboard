'use strict';

module.exports = {

  env: 'development',

  envFolder: 'app',

  db: {
    database: 'codeboard'
  },

  mongo: {
    uri: process.env.MONGO_DB_URI
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
