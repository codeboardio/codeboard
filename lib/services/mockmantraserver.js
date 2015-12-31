/**
 * Created by Martin on 14/07/14.
 */


'use strict';

var express = require('express'),
  path = require('path'),
  fs = require('fs'),
  bodyParser = require('body-parser'),
  util = require('util');



// once we have many express settings, we want to store them in the config file
// Express settings
//require('./lib/config/express')(app);


/**
 * Main application file
 */



var app = express();
app.use(bodyParser());

/**
 * Mock the compilation service in Mantra
 */
app.post('/compile', function(req, res) {
  var data = req.body;
  var clean = true;
  clean = data.clean;
  console.log('Compile request Mock server'+clean);
  if (data.clean==='true') {
    res.send(200, 'Mocking CLEAN Compilation succeeded of project: '+data.id+' path '+data.path+' target '+data.target);
  }
  else {
    res.send(200, 'Mocking  Compilation succeeded of project: '+data.id+' path '+data.path+' target '+data.target);
  }

});


/**
 * Mock the run service in Mantra
 */
app.get('/run', function(req, res) {
  var id = req.query.id;
  res.send(200, 'Mocking Running project: '+id);

});

/**
 * Mock the interface view service in Mantra
 */
app.get('/interfaceView', function(req, res) {
  var id = req.query.id;
  var className = req.query.class;
  res.send(200, 'Mocking interface view project: '+id+" class: "+className);

});

/**
 * Mock the flat view service in Mantra
 */
app.get('/flatView', function(req, res) {
  var id = req.query.id;
  var className = req.query.class;
  res.send(200, 'Mocking Flat view project: '+id+" class: "+className);

});

/**
 * Mock the contract view service in Mantra
 */
app.get('/contractView', function(req, res) {
  var id = req.query.id; // ID in Mantra
  var className = req.query.class;
  res.send(200, 'Mocking Contract view project: '+id+" class: "+className);

});

/**
 * Mock the class descendants view service in Mantra
 */
app.get('/classDescendants', function(req, res) {
  var id = req.query.id; // ID in Mantra
  var className = req.query.class;
  res.send(200, 'Mocking Class Descendants in project: '+id+" class: "+className);

});

/**
 * Mock the class Ancestors view service in Mantra
 */
app.get('/classAncestors', function(req, res) {
  var id = req.query.id; // ID in Mantra
  var className = req.query.class;
  res.send(200, 'Mocking Class Ancestors in project: '+id+" class: "+className);

});

/**
 * Mock the class Clients view service in Mantra
 */
app.get('/classClients', function(req, res) {
  var id = req.query.id; // ID in Mantra
  var className = req.query.class;
  res.send(200, 'Mocking Class Clients in project: '+id+" class: "+className);

});

/**
 * Mock the class Suppliers view service in Mantra
 */
app.get('/classSuppliers', function(req, res) {
  var id = req.query.id; // ID in Mantra
  var className = req.query.class;
  res.send(200, 'Mocking Class Suppliers in project: '+id+" class: "+className);

});

/**
 * Mock the class Suppliers view service in Mantra
 */
app.get('/featureCallers', function(req, res) {
  var id = req.query.id; // ID in Mantra
  var className = req.query.class;
  var featureName = req.query.feature;
  res.send(200, 'Mocking Class feature callers in project: '+id+" class: "+className+" feature "+featureName);

});

/**
 * Mock the class Suppliers view service in Mantra
 */
app.get('/commandLine', function(req, res) {
  var id = req.query.id; // ID in Mantra
  var commandLine = req.query.command_line;
  var featureName = req.query.feature;
  res.send(200, 'Mocking Command line compiler, ID: '+id+" arguments: "+commandLine);

});


app.listen(7778, function () {
  console.log('Mocking Mantra Express server listening on port');
});