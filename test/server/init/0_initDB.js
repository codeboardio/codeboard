var env = process.env.NODE_ENV = process.env.NODE_ENV || 'test';

var //app = require('../../../server.js'),
  request = require('supertest'),
  express = require('express'),
  should = require('should'),
  bodyParser = require('body-parser');

var db = require('../../../lib/models');

describe('Test Server: Init the DB', function () {

  this.timeout(5000);

  it('DB: create empty data BD with dummy data', function (done) {
    // Disable the foreign key constraints before trying to sync the models.
    // Otherwise, we're likely to violate a constraint while dropping a table.
    db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
      .spread(function (res, meta) {
        return db.sequelize.sync({force: true});
      })
      .then(function () {
        return db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      })
      .spread(function (res, meta) {
        if (false) {
          console.log('Error in initDB:');
          console.log(err);
          throw err[0]
        } else {

          // write some test data in the db
          var templateProjects = require('../../../lib/config/dbTemplateProjects.js');
          var dbDummyData = require('./dbDummyData.js');

          templateProjects.addAllTemplateProjects()
            .then(function() {
              return dbDummyData.createDbDummyData();
            })
            .then(function() {
              done();
            });
        }
      });
  });

});
