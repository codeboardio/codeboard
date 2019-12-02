'use strict';

module.exports = {

  env: 'production',

  envFolder: 'public',

  dbTemplates: 'lib/config/db_templates',

  db: {
    database: 'codeboard'
  },

  mongo: {
    uri: process.env.MONGO_DB_URI || 'mongodb://localhost/codeboardLogs'
  },

  codeboard: {
    // because we use https in production, we also need to use wss
    wsHostname: 'wss://localhost:9000'
  },

  mantra : {
    protocol: process.env.MANTRA_PROTOCOL || 'wss://'
  },

};
