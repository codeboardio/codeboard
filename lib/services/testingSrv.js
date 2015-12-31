/**
 * This service calls the Kali server and gets the
 * result of testing a project
 *
 * @param projectId
 * @param files
 * @param options
 */
var config = require('../config/config.js'),
  http = require('http'),
  Promise = require('bluebird'),
  request = Promise.promisifyAll(require('request')); // use bluebird promises for requests


/**
 * Invokes the Eiffel compilation and returns a promise
 * @param data {object} contains the files and a property "language" which is used to determine the Kali URL endpoint
 * @param testSubmission {boolean} if true, the test for the submission will be run, otherwise the user's tests will be run
 * @returns {*|Promise} a bluebird promise
 */
var test = function (data, testSubmission) {


  // the Kali domain name
  var url = config.kali.url + ':' + config.kali.port;
  // the path of the url

  // determine Kali endpoint based on project's language
  switch (data.language) {
    case ('Java-JUnit'):
      url += '/java';
      break;
    case ('Haskell-HSpec'):
      url += '/haskell';
      break;
    case ('Python-UnitTest'):
      url += '/python';
      break;
    default:
      url += '';
  }


  // we define the kali payload according to the specs: https://github.com/DOSE-ETH/kali/wiki
  var payload = {
    files: [],
    testFiles: []
  };

  // separate the data.files by their type (src files, test files etc.)
  var filesByType = getFilesByType(data.files);

  // add the files for the payload
  if(testSubmission) {
    payload.files = (filesByType.srcFiles.concat(filesByType.testFiles)).concat(filesByType.otherFiles);
    payload.testFiles = filesByType.testSubmissionFiles;
  }
  else {
    payload.files = filesByType.srcFiles.concat(filesByType.otherFiles);
    payload.testFiles = filesByType.testFiles;
  }
  //console.log('Test files are: ')
  //console.log(payload);

  // return the promise that resolves when the compilation finishes and the server replies
  return request.postAsync({url: url, json: true, body: payload})
    .spread(function (res, body) {

      if (res.statusCode >= 400) {
        // create an error object
        var err = {
          statusCode: res.statusCode,
          body: body
        };

        // reject the promise
        return Promise.reject(err);
      }
      else {
        return body;
      }
    });
};


/**
 * Removes a leading "./" or "/" from a given string and adds a "/" in the end.
 * @param path {string} a string that typically represents a path
 * @return {string} the input without leading "./" or "/" and trailing "/"
 */
var normalizePath = function (path) {

  var cleanPath = path;

  // check the beginning
  if (path.indexOf('./') === 0) {
    cleanPath = cleanPath.substr(2);
  }
  else if (path.indexOf('/') === 0) {
    cleanPath = cleanPath.substr(1);
  }

  // check the end
  if(cleanPath.charAt(cleanPath.length - 1) !== '/') {
    cleanPath += '/';
  }

  return cleanPath;
};


/**
 * Takes data as send from the Codeboard IDE and brings it in a format that's
 * compatible with the Kali testing service.
 * @param fileData {Array} array of files, where each file is an object with properties 'filename' and 'content'
 * @return fileData {Object} object with for properties, each an array: 'srcFiles', 'testFiles', 'testSubmissionFiles', 'otherFiles'
 */
var getFilesByType = function (fileData) {

  // we need to find the codeboard.json file
  // then extract the values of properties "DirectoryForSourceFiles", "DirectoryForTestFiles", "DirectoryForTestSubmissionFiles"
  // if we can't find those properties in the codeboard.json, we'll use default values

  var coboConfigFileName = 'codeboard.json',
    dirOfSrcFilesProperty = 'DirectoryForSourceFiles',
    dirOfSrcFiles = 'Root/src',
    dirOfTestFilesProperty = 'DirectoryForTestFiles',
    dirOfTestFiles = 'Root/test',
    dirOfTestSubmissionFilesProperty = 'DirectoryForTestSubmissionFiles',
    dirOfTestSubmissionFiles = 'Root/test_submission';


  var result = {
    srcFiles: [],
    testFiles: [],
    testSubmissionFiles: [],
    otherFiles: []
  };

  for(var i = 0; i < fileData.length; i++) {

    if(fileData[i].filename.indexOf(coboConfigFileName) !== -1) {
      // found the cobo config file
      var coboConfigFile = fileData[i];

      // parse the config file, if the config file is not valid Json, we catch the error
      try {
        var config = JSON.parse(coboConfigFile.content);

        // access the content of the config file
        dirOfSrcFiles = config[dirOfSrcFilesProperty] ? config[dirOfSrcFilesProperty] : dirOfSrcFiles;
        dirOfTestFiles = config[dirOfTestFilesProperty] ? config[dirOfTestFilesProperty] : dirOfTestFiles;
        dirOfTestSubmissionFiles = config[dirOfTestSubmissionFilesProperty] ? config[dirOfTestSubmissionFilesProperty] : dirOfTestSubmissionFiles;
      }
      catch(e) {
        console.log('testingSrvjs.getFilesByType: Exception while trying to read codeboard.json: ' + e);
      }
    }
  }

  // remove leading dot or slash form the path and add trailing "/"
  // Note: why do we need a trailing "/"; otherwise, if we check for "Root/test" and "Root/test_submission",
  // every "Root/test_submission" file is also recognized as "Root/test" because they share the same prefix.
  dirOfSrcFiles = normalizePath(dirOfSrcFiles);
  dirOfTestFiles = normalizePath(dirOfTestFiles);
  dirOfTestSubmissionFiles = normalizePath(dirOfTestSubmissionFiles);


  // iterate through all files and differentiate them according to src or testing files
  for (var i = 0; i < fileData.length; i++) {

    // Note: in the following we use simple "if" and not "else if" because a user
    // could decided that dirOfTestFiles and dirOfTestSubmissionFiles should be the same (e.g. in both cases
    // take the test from folder 'submissionTest'). If we were to use an "else if" that would not be possible.

    var _fileAdded = false;

    if (fileData[i].filename.indexOf(dirOfSrcFiles) === 0) {
      // found a file in the src directory
      result.srcFiles.push(fileData[i]);
      _fileAdded = true;
    }

    if (fileData[i].filename.indexOf(dirOfTestFiles) === 0) {
      // found a file in the test directory
      result.testFiles.push(fileData[i]);
      _fileAdded = true;
    }

    if (fileData[i].filename.indexOf(dirOfTestSubmissionFiles) === 0) {
      result.testSubmissionFiles.push(fileData[i]);
      _fileAdded = true;
    }

    if (!_fileAdded) {
      result.otherFiles.push(fileData[i]);
    }
  }

  return result;
};


exports.test = test;
exports.getFilesByType = getFilesByType;
