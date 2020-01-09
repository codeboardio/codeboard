'use strict';

module.exports = {

  env: 'development',

  envFolder: 'app',

  dbTemplates: 'db_templates',

  db: {
    database: 'codeboard_dev'
  },

  mongo: {
    uri: process.env.MONGO_DB_URI || 'mongodb://localhost/fullstack-dev'
  }

};
