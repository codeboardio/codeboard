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
    wsHostname: 'wss://env-4723644.jcloud.ik-server.com'
  },

};
