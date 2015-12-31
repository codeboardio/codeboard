/*
*
* Author: haches
*
* This code holds the configuration for the DB.
* It also allows to load all model files that exist
* in the folder 'models'.
*
* The models can afterwards be accesses using db.ModelName
*
*/

var fs = require('fs'),
  path = require('path'),
  Sequelize = require('sequelize'),
  lodash = require('lodash'),
  config = require('../config/config.js'),
  sequelize = new Sequelize(config.db.database, config.db.username, config.db.password, {host: config.db.host, port: config.db.port, logging: false}),
  db        = {};

 fs
   .readdirSync(__dirname)
   .filter(function(file) {
     return (file.indexOf('.') !== 0) && (file !== 'index.js');
   })
   .forEach(function(file) {
     var model = sequelize.import(path.join(__dirname, file));
     db[model.name] = model;
   });

 Object.keys(db).forEach(function(modelName) {
   if ('associate' in db[modelName]) {
     db[modelName].associate(db);
   }
 });

 module.exports = lodash.extend({
   sequelize: sequelize,
   Sequelize: Sequelize
 }, db);
