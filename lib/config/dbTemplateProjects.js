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
  Promise = require('bluebird');


var addTemplateForC = function() {

  return new Promise(function (resolve, reject) {

    db.TemplateProject
      .find({
        where: {language: 'C'}
      }).then(function(result) {

        if(result === null) {

          var _templateProjectId = -1;

          db.TemplateProject.create({
            language: 'C'
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
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {

            //console.log('Current working directory: ' + process.cwd());
            // reads the file relative the process.cwd() (that's where server.js lives)
            var _content = fs.readFileSync('db_templates/C/Root/main.c', 'utf8');

            return db.TemplateFile.create({
              filename: 'main.c',
              path: 'Root',
              uniqueId: 1,
              parentUId: 0,
              isFolder: false,
              content: _content,
              isHidden: false,
              TemplateProjectId: _templateProjectId,
              foo: "test"
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


var addTemplateForCpp = function() {

  return new Promise(function (resolve, reject) {
    db.TemplateProject
      .find({
        where: {language: 'C++'}
      }).then(function(result) {

        if(result === null) {

          var _templateProjectId = -1;

          db.TemplateProject.create({
            language: 'C++'
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
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {

            //console.log('Current working directory: ' + process.cwd());
            // reads the file relative the process.cwd() (that's where server.js lives)
            var _content = fs.readFileSync('db_templates/C++/Root/main.cpp', 'utf8');

            return db.TemplateFile.create({
              filename: 'main.cpp',
              path: 'Root',
              uniqueId: 1,
              parentUId: 0,
              isFolder: false,
              content: _content,
              isHidden: false,
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


var addTemplateForHaskell = function() {

  return new Promise(function (resolve, reject) {
    db.TemplateProject
      .find({
        where: {language: 'Haskell'}
      }).then(function(result) {

        if(result === null) {

          var _templateProjectId = -1;

          db.TemplateProject.create({
            language: 'Haskell'
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
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {
            //console.log('Current working directory: ' + process.cwd());
            // reads the file relative the process.cwd() (that's where server.js lives)
            var _content = fs.readFileSync('db_templates/Haskell/Root/codeboard.json', 'utf8');

            return db.TemplateFile.create({
              filename: 'codeboard.json',
              path: 'Root',
              uniqueId: 1,
              parentUId: 0,
              isFolder: false,
              content: _content,
              isHidden: true,
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {
            //console.log('Current working directory: ' + process.cwd());
            // reads the file relative the process.cwd() (that's where server.js lives)
            var _content = fs.readFileSync('db_templates/Haskell/Root/Main.hs', 'utf8');

            return db.TemplateFile.create({
              filename: 'Main.hs',
              path: 'Root',
              uniqueId: 2,
              parentUId: 0,
              isFolder: false,
              content: _content,
              isHidden: false,
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


var addTemplateForHaskellHSpec = function() {

  return new Promise(function (resolve, reject) {
    db.TemplateProject
      .find({
        where: {language: 'Haskell-HSpec'}
      }).then(function(result) {

        if(result === null) {

          var _templateProjectId = -1;

          db.TemplateProject.create({
            language: 'Haskell-HSpec'
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
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {

            // the Src folder
            return db.TemplateFile.create({
              filename: 'Src',
              path: 'Root',
              uniqueId: 1,
              parentUId: 0,
              isFolder: true,
              content: '',
              isHidden: false,
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {

            // the Test folder
            return db.TemplateFile.create({
              filename: 'Test',
              path: 'Root',
              uniqueId: 2,
              parentUId: 0,
              isFolder: true,
              content: '',
              isHidden: false,
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {

            // the Test folder
            return db.TemplateFile.create({
              filename: 'TestSubmisison',
              path: 'Root',
              uniqueId: 3,
              parentUId: 0,
              isFolder: true,
              content: '',
              isHidden: true,
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {
            //console.log('Current working directory: ' + process.cwd());
            // reads the file relative the process.cwd() (that's where server.js lives)
            var _content = fs.readFileSync('db_templates/Haskell-HSpec/Root/codeboard.json', 'utf8');

            return db.TemplateFile.create({
              filename: 'codeboard.json',
              path: 'Root',
              uniqueId: 4,
              parentUId: 0,
              isFolder: false,
              content: _content,
              isHidden: true,
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {
            //console.log('Current working directory: ' + process.cwd());
            // reads the file relative the process.cwd() (that's where server.js lives)
            var _content = fs.readFileSync('db_templates/Haskell-HSpec/Root/Src/Main.hs', 'utf8');

            return db.TemplateFile.create({
              filename: 'Main.hs',
              path: 'Root/Src',
              uniqueId: 5,
              parentUId: 1,
              isFolder: false,
              content: _content,
              isHidden: false,
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {
              //console.log('Current working directory: ' + process.cwd());
              // reads the file relative the process.cwd() (that's where server.js lives)
              var _content = fs.readFileSync('db_templates/Haskell-HSpec/Root/Src/Finder.hs', 'utf8');

              return db.TemplateFile.create({
                filename: 'Finder.hs',
                path: 'Root/Src',
                uniqueId: 6,
                parentUId: 1,
                isFolder: false,
                content: _content,
                isHidden: false,
                TemplateProjectId: _templateProjectId
              });
            }).then(function(templateFile) {
              //console.log('Current working directory: ' + process.cwd());
              // reads the file relative the process.cwd() (that's where server.js lives)
              var _content = fs.readFileSync('db_templates/Haskell-HSpec/Root/Test/FinderSpec.hs', 'utf8');

              return db.TemplateFile.create({
                filename: 'FinderSpec.hs',
                path: 'Root/Test',
                uniqueId: 7,
                parentUId: 2,
                isFolder: false,
                content: _content,
                isHidden: false,
                TemplateProjectId: _templateProjectId
              });
            }).then(function(templateFile) {
              //console.log('Current working directory: ' + process.cwd());
              // reads the file relative the process.cwd() (that's where server.js lives)
              var _content = fs.readFileSync('db_templates/Haskell-HSpec/Root/TestSubmission/SubSpec.hs', 'utf8');

              return db.TemplateFile.create({
                filename: 'SubSpec.hs',
                path: 'Root/TestSubmission',
                uniqueId: 8,
                parentUId: 3,
                isFolder: false,
                content: _content,
                isHidden: true,
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


var addTemplateForJava = function() {

  return new Promise(function (resolve, reject) {
    db.TemplateProject
      .find({
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
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {
            //console.log('Current working directory: ' + process.cwd());
            // reads the file relative the process.cwd() (that's where server.js lives)
            var _content = fs.readFileSync('db_templates/Java/Root/codeboard.json', 'utf8');

            return db.TemplateFile.create({
              filename: 'codeboard.json',
              path: 'Root',
              uniqueId: 1,
              parentUId: 0,
              isFolder: false,
              content: _content,
              isHidden: true,
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {
            //console.log('Current working directory: ' + process.cwd());
            // reads the file relative the process.cwd() (that's where server.js lives)
            var _content = fs.readFileSync('db_templates/Java/Root/Main.java', 'utf8');

            return db.TemplateFile.create({
              filename: 'Main.java',
              path: 'Root',
              uniqueId: 2,
              parentUId: 0,
              isFolder: false,
              content: _content,
              isHidden: false,
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
      .find({
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
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {
            //console.log('Current working directory: ' + process.cwd());
            // reads the file relative the process.cwd() (that's where server.js lives)
            var _content = fs.readFileSync('db_templates/Java-JUnit/Root/codeboard.json', 'utf8');

            return db.TemplateFile.create({
              filename: 'codeboard.json',
              path: 'Root',
              uniqueId: 4,
              parentUId: 0,
              isFolder: false,
              content: _content,
              isHidden: true,
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {
            //console.log('Current working directory: ' + process.cwd());
            // reads the file relative the process.cwd() (that's where server.js lives)
            var _content = fs.readFileSync('db_templates/Java-JUnit/Root/src/Main.java', 'utf8');

            return db.TemplateFile.create({
              filename: 'Main.java',
              path: 'Root/src',
              uniqueId: 5,
              parentUId: 1,
              isFolder: false,
              content: _content,
              isHidden: false,
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {
            //console.log('Current working directory: ' + process.cwd());
            // reads the file relative the process.cwd() (that's where server.js lives)
            var _content = fs.readFileSync('db_templates/Java-JUnit/Root/src/Finder.java', 'utf8');

            return db.TemplateFile.create({
              filename: 'Finder.java',
              path: 'Root/src',
              uniqueId: 6,
              parentUId: 1,
              isFolder: false,
              content: _content,
              isHidden: false,
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {
            //console.log('Current working directory: ' + process.cwd());
            // reads the file relative the process.cwd() (that's where server.js lives)
            var _content = fs.readFileSync('db_templates/Java-JUnit/Root/test/FinderTest.java', 'utf8');

            return db.TemplateFile.create({
              filename: 'FinderTest.java',
              path: 'Root/test',
              uniqueId: 7,
              parentUId: 2,
              isFolder: false,
              content: _content,
              isHidden: false,
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {
            //console.log('Current working directory: ' + process.cwd());
            // reads the file relative the process.cwd() (that's where server.js lives)
            var _content = fs.readFileSync('db_templates/Java-JUnit/Root/test_submission/SubTest.java', 'utf8');

            return db.TemplateFile.create({
              filename: 'SubTest.java',
              path: 'Root/test_submission',
              uniqueId: 8,
              parentUId: 3,
              isFolder: false,
              content: _content,
              isHidden: true,
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
      .find({
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
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {
            //console.log('Current working directory: ' + process.cwd());
            // reads the file relative the process.cwd() (that's where server.js lives)
            var _content = fs.readFileSync('db_templates/Python/Root/codeboard.json', 'utf8');

            return db.TemplateFile.create({
              filename: 'codeboard.json',
              path: 'Root',
              uniqueId: 1,
              parentUId: 0,
              isFolder: false,
              content: _content,
              isHidden: true,
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {
            //console.log('Current working directory: ' + process.cwd());
            // reads the file relative the process.cwd() (that's where server.js lives)
            var _content = fs.readFileSync('db_templates/Python/Root/main.py', 'utf8');

            return db.TemplateFile.create({
              filename: 'main.py',
              path: 'Root',
              uniqueId: 2,
              parentUId: 0,
              isFolder: false,
              content: _content,
              isHidden: false,
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
      .find({
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
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {
            var _content = fs.readFileSync('db_templates/Python-UnitTest/Root/__init__.py', 'utf8');

            return db.TemplateFile.create({
              filename: '__init__.py',
              path: 'Root',
              uniqueId: 4,
              parentUId: 0,
              isFolder: false,
              content: _content,
              isHidden: false,
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {
            var _content = fs.readFileSync('db_templates/Python-UnitTest/Root/codeboard.json', 'utf8');

            return db.TemplateFile.create({
              filename: 'codeboard.json',
              path: 'Root',
              uniqueId: 5,
              parentUId: 0,
              isFolder: false,
              content: _content,
              isHidden: true,
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {
            var _content = fs.readFileSync('db_templates/Python-UnitTest/Root/src/__init__.py', 'utf8');

            return db.TemplateFile.create({
              filename: '__init__.py',
              path: 'Root/src',
              uniqueId: 6,
              parentUId: 1,
              isFolder: false,
              content: _content,
              isHidden: false,
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {
            var _content = fs.readFileSync('db_templates/Python-UnitTest/Root/src/main.py', 'utf8');

            return db.TemplateFile.create({
              filename: 'main.py',
              path: 'Root/src',
              uniqueId: 7,
              parentUId: 1,
              isFolder: false,
              content: _content,
              isHidden: false,
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {
            var _content = fs.readFileSync('db_templates/Python-UnitTest/Root/src/finder.py', 'utf8');

            return db.TemplateFile.create({
              filename: 'finder.py',
              path: 'Root/src',
              uniqueId: 8,
              parentUId: 1,
              isFolder: false,
              content: _content,
              isHidden: false,
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {
            var _content = fs.readFileSync('db_templates/Python-UnitTest/Root/test/__init__.py', 'utf8');

            return db.TemplateFile.create({
              filename: '__init__.py',
              path: 'Root/test',
              uniqueId: 9,
              parentUId: 2,
              isFolder: false,
              content: _content,
              isHidden: false,
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {
            var _content = fs.readFileSync('db_templates/Python-UnitTest/Root/test/finderTest.py', 'utf8');

            return db.TemplateFile.create({
              filename: 'finderTest.py',
              path: 'Root/test',
              uniqueId: 10,
              parentUId: 2,
              isFolder: false,
              content: _content,
              isHidden: false,
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {
            var _content = fs.readFileSync('db_templates/Python-UnitTest/Root/testSubmission/__init__.py', 'utf8');

            return db.TemplateFile.create({
              filename: '__init__.py',
              path: 'Root/testSubmission',
              uniqueId: 11,
              parentUId: 3,
              isFolder: false,
              content: _content,
              isHidden: true,
              TemplateProjectId: _templateProjectId
            });
          }).then(function(templateFile) {
            var _content = fs.readFileSync('db_templates/Python-UnitTest/Root/testSubmission/subTest.py', 'utf8');

            return db.TemplateFile.create({
              filename: 'subTest.py',
              path: 'Root/testSubmission',
              uniqueId: 12,
              parentUId: 3,
              isFolder: false,
              content: _content,
              isHidden: true,
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

  return addTemplateForC().then(function() {
    return addTemplateForCpp();
  }).then(function() {
    return addTemplateForHaskell();
  }).then(function() {
    return addTemplateForHaskellHSpec();
  }).then(function() {
    return addTemplateForJava();
  }).then(function() {
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
