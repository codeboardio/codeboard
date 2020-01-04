/**
 * Created by hce on 03/22/15.
 *
 * Adds template projects to the database
 * if a template for that particular language does not yet exist.
 *
 */


var db = require('../models'),
    util = require('util'),
    fs = require('fs'),
    Promise = require('bluebird'),
    config = require('./config');


var addTemplateForJava = function() {

  return new Promise(function (resolve, reject) {
    db.TemplateProject
        .findOne({
          where: {language: 'Java'}
        }).then(function(result) {

      if(result === null) {

        var _templateProjectId = -1;

        db.TemplateProject.create({
          language: 'Java'
        }).then(function(templatePrj){

          _templateProjectId = templatePrj.id;

          return db.TemplateFile.create({
            filename: 'Root',
            path: '',
            uniqueId: 0,
            parentUId: -1,
            isFolder: true,
            content: '',
            isHidden: false,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {
          //console.log('Current working directory: ' + process.cwd());
          // reads the file relative the process.cwd() (that's where server.js lives)
          var _content = fs.readFileSync(config.dbTemplates + '/Java/Root/codeboard.json', 'utf8');

          return db.TemplateFile.create({
            filename: 'codeboard.json',
            path: 'Root',
            uniqueId: 1,
            parentUId: 0,
            isFolder: false,
            content: _content,
            isHidden: true,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {
          //console.log('Current working directory: ' + process.cwd());
          // reads the file relative the process.cwd() (that's where server.js lives)
          var _content = fs.readFileSync(config.dbTemplates + '/Java/Root/Main.java', 'utf8');

          return db.TemplateFile.create({
            filename: 'Main.java',
            path: 'Root',
            uniqueId: 2,
            parentUId: 0,
            isFolder: false,
            content: _content,
            isHidden: false,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {
          resolve();
        });
      }
      else {
        // the template project already exists, so we do nothing and just return a resolved promise
        resolve();
      }
    });
  });
};


var addTemplateForJavaJUnit = function() {

  return new Promise(function (resolve, reject) {
    db.TemplateProject
        .findOne({
          where: {language: 'Java-JUnit'}
        }).then(function(result) {

      if(result === null) {

        var _templateProjectId = -1;

        db.TemplateProject.create({
          language: 'Java-JUnit'
        }).then(function(templatePrj){

          _templateProjectId = templatePrj.id;

          // the Root folder
          return db.TemplateFile.create({
            filename: 'Root',
            path: '',
            uniqueId: 0,
            parentUId: -1,
            isFolder: true,
            content: '',
            isHidden: false,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {

          // the Src folder
          return db.TemplateFile.create({
            filename: 'src',
            path: 'Root',
            uniqueId: 1,
            parentUId: 0,
            isFolder: true,
            content: '',
            isHidden: false,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {

          // the Test folder
          return db.TemplateFile.create({
            filename: 'test',
            path: 'Root',
            uniqueId: 2,
            parentUId: 0,
            isFolder: true,
            content: '',
            isHidden: false,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {

          // the Test folder
          return db.TemplateFile.create({
            filename: 'test_submission',
            path: 'Root',
            uniqueId: 3,
            parentUId: 0,
            isFolder: true,
            content: '',
            isHidden: true,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {
          //console.log('Current working directory: ' + process.cwd());
          // reads the file relative the process.cwd() (that's where server.js lives)
          var _content = fs.readFileSync(config.dbTemplates + '/Java-JUnit/Root/codeboard.json', 'utf8');

          return db.TemplateFile.create({
            filename: 'codeboard.json',
            path: 'Root',
            uniqueId: 4,
            parentUId: 0,
            isFolder: false,
            content: _content,
            isHidden: true,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {
          //console.log('Current working directory: ' + process.cwd());
          // reads the file relative the process.cwd() (that's where server.js lives)
          var _content = fs.readFileSync(config.dbTemplates + '/Java-JUnit/Root/src/Main.java', 'utf8');

          return db.TemplateFile.create({
            filename: 'Main.java',
            path: 'Root/src',
            uniqueId: 5,
            parentUId: 1,
            isFolder: false,
            content: _content,
            isHidden: false,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {
          //console.log('Current working directory: ' + process.cwd());
          // reads the file relative the process.cwd() (that's where server.js lives)
          var _content = fs.readFileSync(config.dbTemplates + '/Java-JUnit/Root/src/Finder.java', 'utf8');

          return db.TemplateFile.create({
            filename: 'Finder.java',
            path: 'Root/src',
            uniqueId: 6,
            parentUId: 1,
            isFolder: false,
            content: _content,
            isHidden: false,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {
          //console.log('Current working directory: ' + process.cwd());
          // reads the file relative the process.cwd() (that's where server.js lives)
          var _content = fs.readFileSync(config.dbTemplates + '/Java-JUnit/Root/test/FinderTest.java', 'utf8');

          return db.TemplateFile.create({
            filename: 'FinderTest.java',
            path: 'Root/test',
            uniqueId: 7,
            parentUId: 2,
            isFolder: false,
            content: _content,
            isHidden: false,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {
          //console.log('Current working directory: ' + process.cwd());
          // reads the file relative the process.cwd() (that's where server.js lives)
          var _content = fs.readFileSync(config.dbTemplates + '/Java-JUnit/Root/test_submission/SubTest.java', 'utf8');

          return db.TemplateFile.create({
            filename: 'SubTest.java',
            path: 'Root/test_submission',
            uniqueId: 8,
            parentUId: 3,
            isFolder: false,
            content: _content,
            isHidden: true,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {
          resolve();
        });
      }
      else {
        // the template project already exists, so we do nothing and just return a resolved promise
        resolve();
      }
    });
  });
};


var addTemplateForPython = function() {

  return new Promise(function (resolve, reject) {
    db.TemplateProject
        .findOne({
          where: {language: 'Python'}
        }).then(function(result) {

      if(result === null) {

        var _templateProjectId = -1;

        db.TemplateProject.create({
          language: 'Python'
        }).then(function(templatePrj){

          _templateProjectId = templatePrj.id;

          return db.TemplateFile.create({
            filename: 'Root',
            path: '',
            uniqueId: 0,
            parentUId: -1,
            isFolder: true,
            content: '',
            isHidden: false,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {
          //console.log('Current working directory: ' + process.cwd());
          // reads the file relative the process.cwd() (that's where server.js lives)
          var _content = fs.readFileSync(config.dbTemplates + '/Python/Root/codeboard.json', 'utf8');

          return db.TemplateFile.create({
            filename: 'codeboard.json',
            path: 'Root',
            uniqueId: 1,
            parentUId: 0,
            isFolder: false,
            content: _content,
            isHidden: true,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {
          //console.log('Current working directory: ' + process.cwd());
          // reads the file relative the process.cwd() (that's where server.js lives)
          var _content = fs.readFileSync(config.dbTemplates + '/Python/Root/main.py', 'utf8');

          return db.TemplateFile.create({
            filename: 'main.py',
            path: 'Root',
            uniqueId: 2,
            parentUId: 0,
            isFolder: false,
            content: _content,
            isHidden: false,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {
          resolve();
        });
      }
      else {
        // the template project already exists, so we do nothing and just return a resolved promise
        resolve();
      }
    });
  });
};


var addTemplateForPythonUnitTest = function() {

  return new Promise(function (resolve, reject) {
    db.TemplateProject
        .findOne({
          where: {language: 'Python-UnitTest'}
        }).then(function(result) {

      if(result === null) {

        var _templateProjectId = -1;

        db.TemplateProject.create({
          language: 'Python-UnitTest'
        }).then(function(templatePrj){

          _templateProjectId = templatePrj.id;

          // the Root folder
          return db.TemplateFile.create({
            filename: 'Root',
            path: '',
            uniqueId: 0,
            parentUId: -1,
            isFolder: true,
            content: '',
            isHidden: false,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {

          // the Src folder
          return db.TemplateFile.create({
            filename: 'src',
            path: 'Root',
            uniqueId: 1,
            parentUId: 0,
            isFolder: true,
            content: '',
            isHidden: false,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {

          // the Test folder
          return db.TemplateFile.create({
            filename: 'test',
            path: 'Root',
            uniqueId: 2,
            parentUId: 0,
            isFolder: true,
            content: '',
            isHidden: false,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {

          // the Test folder
          return db.TemplateFile.create({
            filename: 'testSubmission',
            path: 'Root',
            uniqueId: 3,
            parentUId: 0,
            isFolder: true,
            content: '',
            isHidden: true,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {
          var _content = fs.readFileSync(config.dbTemplates + '/Python-UnitTest/Root/__init__.py', 'utf8');

          return db.TemplateFile.create({
            filename: '__init__.py',
            path: 'Root',
            uniqueId: 4,
            parentUId: 0,
            isFolder: false,
            content: _content,
            isHidden: false,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {
          var _content = fs.readFileSync(config.dbTemplates + '/Python-UnitTest/Root/codeboard.json', 'utf8');

          return db.TemplateFile.create({
            filename: 'codeboard.json',
            path: 'Root',
            uniqueId: 5,
            parentUId: 0,
            isFolder: false,
            content: _content,
            isHidden: true,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {
          var _content = fs.readFileSync(config.dbTemplates + '/Python-UnitTest/Root/src/__init__.py', 'utf8');

          return db.TemplateFile.create({
            filename: '__init__.py',
            path: 'Root/src',
            uniqueId: 6,
            parentUId: 1,
            isFolder: false,
            content: _content,
            isHidden: false,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {
          var _content = fs.readFileSync(config.dbTemplates + '/Python-UnitTest/Root/src/main.py', 'utf8');

          return db.TemplateFile.create({
            filename: 'main.py',
            path: 'Root/src',
            uniqueId: 7,
            parentUId: 1,
            isFolder: false,
            content: _content,
            isHidden: false,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {
          var _content = fs.readFileSync(config.dbTemplates + '/Python-UnitTest/Root/src/finder.py', 'utf8');

          return db.TemplateFile.create({
            filename: 'finder.py',
            path: 'Root/src',
            uniqueId: 8,
            parentUId: 1,
            isFolder: false,
            content: _content,
            isHidden: false,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {
          var _content = fs.readFileSync(config.dbTemplates + '/Python-UnitTest/Root/test/__init__.py', 'utf8');

          return db.TemplateFile.create({
            filename: '__init__.py',
            path: 'Root/test',
            uniqueId: 9,
            parentUId: 2,
            isFolder: false,
            content: _content,
            isHidden: false,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {
          var _content = fs.readFileSync(config.dbTemplates + '/Python-UnitTest/Root/test/finderTest.py', 'utf8');

          return db.TemplateFile.create({
            filename: 'finderTest.py',
            path: 'Root/test',
            uniqueId: 10,
            parentUId: 2,
            isFolder: false,
            content: _content,
            isHidden: false,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {
          var _content = fs.readFileSync(config.dbTemplates + '/Python-UnitTest/Root/testSubmission/__init__.py', 'utf8');

          return db.TemplateFile.create({
            filename: '__init__.py',
            path: 'Root/testSubmission',
            uniqueId: 11,
            parentUId: 3,
            isFolder: false,
            content: _content,
            isHidden: true,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {
          var _content = fs.readFileSync(config.dbTemplates + '/Python-UnitTest/Root/testSubmission/subTest.py', 'utf8');

          return db.TemplateFile.create({
            filename: 'subTest.py',
            path: 'Root/testSubmission',
            uniqueId: 12,
            parentUId: 3,
            isFolder: false,
            content: _content,
            isHidden: true,
            isStatic: false,
            TemplateProjectId: _templateProjectId
          });
        }).then(function(templateFile) {
          resolve();
        });
      }
      else {
        // the template project already exists, so we do nothing and just return a resolved promise
        resolve();
      }
    });
  });
};


/**
 * Adds all the template projects
 * @returns {Bluebird.Promise|*}
 */
var addAllTemplateProjects = function() {

  return addTemplateForJava()
      .then(function() {
        return addTemplateForJavaJUnit();
      }).then(function() {
        return addTemplateForPython();
      }).then(function() {
        return addTemplateForPythonUnitTest();
      }).catch(function(err) {
        console.log('dbTemplateProjectsjs error. Please check validity of template projects.');
        console.log(err);
        return Promise.reject(err);
      });
};


module.exports = {
  addAllTemplateProjects: addAllTemplateProjects
};
