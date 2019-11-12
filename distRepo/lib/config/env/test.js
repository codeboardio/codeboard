'use strict';

module.exports = {

  env: 'test',

  envFolder: 'app',

  db: {
    database: 'codeboard-test'
  },

  mongo: {
    uri: process.env.MONGO_DB_URI || 'mongodb://localhost/codeboardLogs-test'
  }

};
