/**
 * Created by haches on 7/24/14.
 *
 * This service module provides a number of
 * utility functions for projects. Many of
 * them are perform database operations.
 *
 */

'use strict';

var db = require('../models'),
    Promise = require('bluebird'),
    Sequelize = require('sequelize'),
    Op = Sequelize.Op;


/**
 * Returns a promise that resolved to true if the projectId is valid.
 * @param projectId the id for which to check if a project exists
 * @returns {*|Promise} resolved to true or false
 */
var isValidProjectId = function(projectId) {
  return db.Project
    .findByPk(projectId)
    .then(function(prj) {
      var result = true;

      if(prj === null) {
        result = false;
      }

      return result;
    });
};


/**
 * Returns a promise that resolves to true if the project with the given id is a public project.
 * @param projectId the id of the project to check
 * @returns {*|Promise} resolved to true or false
 */
var isPublicProject = function(projectId) {
  return db.Project
    .findByPk(projectId)
    .then(function(prj) {

      var result = false;

      if(prj !== null && prj.isPrivate === false) {
        result = true;
      }

      return result;
    });
};


/**
 * Returns a promise that resolves to an array that contains
 * the usernames of the ownerSet of the project.
 * @param projectId the id of the project
 * @returns a promise that resovles to an array of usernames
 */
var getProjectOwners = function(projectId) {
  return db.Project
    .findOne(
    {
      where: {id: projectId},
      include: [
        {model: db.User, as: 'ownerSet', attributes: ['username']}
      ]
    })
    .then(function(prj) {

      var result = [];
      var owners = prj.ownerSet;

      for(var i = 0; i < owners.length; i++) {
        result.push(owners[i].username);
      }

      return result;
    });
};


/**
 * Returns a promise that resolves to an array that contains
 * the usernames of the userSet of the project.
 * @param projectId the id of the project
 * @returns a promise that resovles to an array of usernames
 */
var getProjectUsers = function(projectId) {
  return db.Project
    .findOne(
    {
      where: {id: projectId},
      include: [
        {model: db.User, as: 'userSet', attributes: ['username']}
      ]
    })
    .then(function(prj) {

      var result = [];

      var users = prj.userSet;
      for(var i = 0; i < users.length; i++) {
        result.push(users[i].username);
      }

      return result;
    });
};


/**
 * @description Returns a promise that resolves to true if given user is owner of given project.
 * @param projectId the id of the project to check
 * @param username the name of the user whom to check for ownership
 * @returns {*|Promise} resolves to true if user is an owner of the project
 */
var isProjectOwner = function(projectId, username) {

  return getProjectOwners(projectId)
    .then(function(ownerArray) {

      var isOwner = ownerArray.some(function(element, index, array) {
        return(element === username);
      });

      return isOwner;
    });
};


/**
 * @description Returns a promise that resolves to true if the user with given username is a user of given project.
 * @param projectId the id of the project to check
 * @param username the name of the user whom to check
 * @returns {*|Promise} resolves to true if user is a valid user of the project
 */
var isProjectUser = function(projectId, username) {

  return getProjectUsers(projectId)
    .then(function(userArray) {

      var isUser = userArray.some(function(element, index, array) {
        return(element === username);
      });

      return isUser;
    });
};


/**
 * @description Returns a promise that resolves to true if the user with given username is an owner or a user of a given project.
 * @param projectId the id of the project to check
 * @param username the name of the user whom to check
 * @returns {*|Promise} resolves to true if user is a valid owner or user of the project
 */
var isProjectOwnerOrUser = function(projectId, username) {

  var checks = [];
  // push the two checks, for owner and user, that we want to run
  checks.push(isProjectOwner(projectId, username));
  checks.push(isProjectUser(projectId, username));

  // argument '2' means both promises in check must finish and return
  return Promise.some(checks, 2)
    .then(function(result) {
      // result is an array of length 2, containing boolean values indicating if current user is a project owner or user
      // at least one of the two result values must be true
      return result[0] || result[1];
    });
};


var setUsersOfProject = function(project, listOfUserNames, asOwners) {

    return db.User
    .findAll({where: {username: {[Op.in]: listOfUserNames}}})
    .then(function(users) {

      if(users === null) {
        return project;
      }
      if(asOwners) {
        return project.setOwnerSet(users);
      }
      else {
        return project.setUserSet(users);
      }
    })
    .then(function(users) {
      // we are not interested in the associated users but want to return the project
      return project;
    })
    .error(function(err) {
      return err;
    });
};


/**
 * Returns a promise that resolve to the project that was provided as the input argument
 * @param project the project to update
 * @param listOfUserNames array with the usernames that should be the new owners of the project
 */
var setUsersAsOwners = function(project, listOfUserNames) {
  return setUsersOfProject(project, listOfUserNames, true);
};


/**
 * Returns a promise that resolve to the project that was provided as the input argument
 * @param project the project to update
 * @param listOfUserNames array with usernames that should be the new users of the project
 */
var setUsersAsUsers = function(project, listOfUserNames) {
  return setUsersOfProject(project, listOfUserNames, false);
};


/**
 * Add new files and associate them with a project.
 * @param fileArray an array of files where each file contains the data necessary for creating an new file
 * @param project the project to update
 * @returns a promise that resolves when all the new files have been created and added the project
 */
var addNewFiles = function(fileArray, project) {

  /* the promises is an array of promises */
  var promises = [];

  /* array to store references to the files we create */
  var newFiles = [];

  for(var i = 0; i < fileArray.length; i++) {

    // create a new promise for the creation of the file
    var x = new Promise(function(resolve, reject) {

      db.File
        .create({
          filename: fileArray[i].filename,
          path: fileArray[i].path,
          uniqueId: fileArray[i].uniqueId,
          parentUId: fileArray[i].parentUId,
          isFolder: fileArray[i].isFolder,
          content: fileArray[i].content,
          isHidden: fileArray[i].isHidden
        })
        .then(function(file) {
          newFiles.push(file);
          resolve(); // resolve the promise once we've stored a reference to the new file
        });

    });

    promises.push(x); // store the promise
  }

  // only when all promises were resolved (i.e. we have created all the files and stored their ids) we continue
  Promise.all(promises).then(function() {

    // clear the promises array
    promises = [];

    for(var i = 0; i < newFiles.length; i++) {
      promises.push(project.addFileSet(newFiles[i]));
    }

    return Promise.all(promises);
  });
};


/**
 * Updates files that are associated with a project.
 * @param fileArray an array of files where each file contains the data necessary for updateing a file.
 * Each file must have an 'id' property that relates to the database id of the file that should be updated.
 * @param project the project to update
 * @returns a promise that resolves when all the files have been updated
 */
var updateExistingFiles = function(fileArray, project) {

  /* the promises is an array of promises */
  var promises = [];

  /* array to store references to the files we create */
  var newFiles = [];

  var updateValues = {};
  for(var i = 0; i < fileArray.length; i++) {
    updateValues[fileArray[i].id] = fileArray[i];
  }


  for(var j = 0; j < fileArray.length; j++) {

    var p = new Promise(function(resolve, reject) {

      db.File
        .findByPk(fileArray[j].id)
        .then(function(file) {

          file.filename = updateValues[file.id].filename;
          file.path = updateValues[file.id].path;
          file.uniqueId = updateValues[file.id].uniqueId;
          file.parentUId = updateValues[file.id].parentUId;
          file.isFolder = updateValues[file.id].isFolder;
          file.content = updateValues[file.id].content;
          file.isHidden = updateValues[file.id].isHidden;

          return file.save();
        })
        .then(function(file) {
          resolve(); // resolve the promise
        });
    });

    promises.push(p);
  }

  return Promise.all(promises);
};


/**
 * Deletes files from a project.
 * @param fileIdsToDelete an array with the ids of the files that should be deleted
 * @param project the project to which the files belong
 * @returns {*|Promise} a promise that resolves once the files are deleted
 */
var removeFilesFromProject = function(fileIdsToDelete, project) {

  // delete all the files that the user deleted
  return db.File
    .destroy({where: {id: fileIdsToDelete}});

};


/**
 * Returns a promise that resolves into an array containing all the project's hidden files.
 * @param {number} projectId the id of the project for which to retrieve the files.
 * @param {boolean} includeHiddenFolders if true, hidden folders are included, otherwise only hidden files are returned
 * @returns {*|Promise} a promise
 */
var getAllHiddenFilesOfProject = function(projectId, includeHiddenFolders) {

  // we certainly only want files or folders that are hidden
  var queryConstraint = {
    isHidden: true
  };

  // depending on the argument, we only return hidden files but not hidden folders
  if(!(includeHiddenFolders)) {
    queryConstraint.isFolder = false;
  }

  return db.Project
    .findAll( // note: need to use findAll again because of the 'where' in the include; it's a bug in sequelize
    {
      where: {id: projectId},
      include: [
        {model: db.File, as: 'fileSet', where: queryConstraint}
      ]
    })
    .then(function(prj) {

      // prj might have length 0 if the project has no hidden files
      if(prj.length === 0) {
        return [];
      }
      else {
        return prj[0].fileSet; // return the array that contains the hidden files as elements
      }
    });
};


/**
 * Taking two arrays with files, the function combines them and returns a single array.
 * If the input 'hiddenFiles' contains any folders, they are discarded.
 * @param hiddenFiles the hidden files for a project, retrieved from the database
 * @param userFiles the files send by the user
 * @return {*} and array of files were elements are object in the form {'filename':'xx', 'content':'yy'}
 */
var getCombinedFiles = function(hiddenFiles, userFiles) {


  // TODO: this function should be smarter
  // TODO: don't just combine the arrays but check
  // if hiddenFiles is empty, we can just return userFiles
  // if hiddenFiles not empty && same file exists in userFiles, use userFiles <- DANGER if user is other than owner!!
  // if hiddenFiles not empty && same file not in userFiles, then add


  // we will certainly return what the user has send, maybe add hidden files to it
  var result = userFiles;

  // the hiddenfiles need to be reformated; we store the reformated files in here
  var additionalFiles = [];

  for(var i = 0; i < hiddenFiles.length; i++) {

    // we need to bring the files into a format that we can send to the compilation service
    var f = hiddenFiles[i];
    if(f.isFolder === false) {
      additionalFiles.push({filename: f.path + '/' + f.filename, content: f.content});
    }
  }

  // if there are any additional files, add them to the data we'll send out for compilation
  if(additionalFiles.length > 0) {
    result = userFiles.concat(additionalFiles);
  }

  return result;
};


/**
 * Given an input string, the function checks if the string has
 * test-result pattern like '<!--@test=0;0;0;-->' and returns the
 * a new string that has the input without the pattern in front.
 * @param input some string, typcially generated by running a user program
 */
var removeTestResult = function(input) {

  var _result = input;

  // first we check for the result-string at the end

  // pattern to search for a result string at the end of the input
  var _endPattern = /<!--@test=\d*(\.\d+)?;\d*(\.\d+)?;\d*(\.\d+)?;?-->\n*$/;
  // check for a match
  var _endMatch = input.match(_endPattern); // will be null if not match is found

  if(_endMatch !== null) {
    // found a result string; get the length and remove it from the result
    _result = _result.slice(0, -(_endMatch[0].length));
  }


  // next we check for the result-string at the beginning

  // the pattern to check in the beginning
  var _beginPattern = /^<!--@test=\d*(\.\d+)?;\d*(\.\d+)?;\d*(\.\d+)?;?-->/;
  // check for a match
  var _beginMatch = input.match(_beginPattern);

  if(_beginMatch !== null) {
    // found a result string at the beginning of the input
    _result =  _result.slice(_beginMatch[0].length);
  }

  return _result;
};


/**
 * Extracts the results 0,0,0 from a string that start with with the pattern '<!--@test=0;0;0;-->'
 * @param input the string that from which to extract the results
 * @return {*} an array that contains the results or an empty array if the pattern can't be found
 */
var extractTestResult = function(input) {

  /** Helper function to extract the grades from a result string */
  var getResultArray = function(resultString) {
    // remove the prefix part (<!--@test=) and the postfix part (-->)
    var _resultString = resultString.substring(10, resultString.length - 3);
    // return the array with the individual grades
    return _resultString.split(';');
  };

  // pattern to search for a result string at the end of the input
  var _endPattern = /<!--@test=\d*(\.\d+)?;\d*(\.\d+)?;\d*(\.\d+)?;?-->(\r\n|\n)*$/;
  // check for a match
  var _endMatch = input.match(_endPattern); // will be null if not match is found

  if(_endMatch !== null) {
    // found a result string, extract the grade and test results and return as array
    return getResultArray(_endMatch[0]);
  }
  else {
    // there was no result string at the end; for legacy reasons we now check at the beginning of input string
    // NOTE: this 'else' part could be deleted if all projects have the result string at the end

    // the pattern to check in the beginning
    var _beginPattern = /^<!--@test=\d*(\.\d+)?;\d*(\.\d+)?;\d*(\.\d+)?;?-->/;
    // check for a match
    var _beginMatch = input.match(_beginPattern);

    if(_beginMatch !== null) {
      // found a result string at the beginning of the input
      return getResultArray(_beginMatch[0]);
    }
  }

  // found no matches for a result string, thus return an empty array
  return [];
};


/**
 * Given a full description the function returnes a shortened version.
 * @param fullProjectDescription the full description string (if null, the function returns an empty string).
 * @param shortLength the length of the shortened version
 * @return {String} the shortened description
 */
var getShortProjectDescription = function(fullProjectDescription, shortLength) {

  // if the description we got is null, we return an empty string; otherwise
  // we might return the full description, especially if it's shorter than 'shortLength'
  var result = fullProjectDescription === null ? '' : fullProjectDescription;

  // if the project has a description, we might have to modify it to be short enough
  if (fullProjectDescription !== null && fullProjectDescription.length > shortLength) {
    // the description is too long so we first cut it down to 250 characters
    result = fullProjectDescription.substring(0, shortLength - 1);
    // next, we try to find the last space character
    var lastSpace = result.lastIndexOf(' ');
    // now we shorten the string until that character so we don't have dangling words
    result = result.substring(0, lastSpace) + ' ...';
  }

  return result;
};


/**
 *
 * @param _fileArray
 * @return {{fileSet: *, lastUId: number}}
 */
var recalculateUniqueIds = function(_fileArray) {

  var fileArray = _fileArray;

  var pathToIdMap = {};

  var uniqueId = 1;

  pathToIdMap[''] = -1;
  pathToIdMap['Root'] = 0;

  // first, we need to sort the fileArray by the number of occurrences of '/' in the path
  // any sub-folder must have a higher uniqueId than it's parent-folder; that's an assumption by the ProjectFactory
  fileArray.sort(function compare(a, b) {

    var countA = (a.path.match(/\//g) || []).length;
    var countB = (b.path.match(/\//g) || []).length;

    if (countA < countB) //a is less than b by some ordering criterion
      return -1;
    if (countA > countB)//a is greater than b by the ordering criterion)
      return 1;
    // a must be equal to b
    return 0;
  });

  for(var i = 0; i < fileArray.length; i++) {

    if (fileArray[i].isFolder && fileArray[i].path.length > 0) {

      // give the folder a uniqueId
      fileArray[i].uniqueId = uniqueId;

      // how the path of the folder maps to the uniqueId
      pathToIdMap[fileArray[i].path + '/' + fileArray[i].filename] = uniqueId;

      // increase the uniqueId
      uniqueId++;
    }
  }

  // at this point, all folders have a uniqueId and we can look it up based on the path


  for (var i = 0; i < fileArray.length; i++) {

    if (!(fileArray[i].isFolder)) {
      // we're looking at a file; need to give it a uniqueId
      fileArray[i].uniqueId = uniqueId;

      // increase the uniqueId
      uniqueId++;
    }

    if(fileArray[i].uniqueId !== 0) { // don't set the parentUId for the root folder (root folder has no empty path and parentUId of -1)
      fileArray[i].parentUId = pathToIdMap[fileArray[i].path];
    }

  }

  return {fileSet: fileArray, lastUId: uniqueId};
};

// export the service functions
exports.isValidProjectId = isValidProjectId;
exports.isPublicProject = isPublicProject;
exports.getProjectOwners = getProjectOwners;
exports.getProjectUsers = getProjectUsers;
exports.isProjectOwner = isProjectOwner;
exports.isProjectUser = isProjectUser;
exports.isProjectOwnerOrUser = isProjectOwnerOrUser;
exports.setUsersOfProject = setUsersOfProject;
exports.setUsersAsOwners = setUsersAsOwners;
exports.setUsersAsUsers = setUsersAsUsers;
exports.addNewFiles = addNewFiles;
exports.updateExistingFiles = updateExistingFiles;
exports.removeFilesFromProject = removeFilesFromProject;
exports.getAllHiddenFilesOfProject = getAllHiddenFilesOfProject;
exports.removeTestResult = removeTestResult;
exports.extractTestResult = extractTestResult;
exports.getCombinedFiles = getCombinedFiles;
exports.getShortProjectDescription = getShortProjectDescription;
exports.recalculateUniqueIds = recalculateUniqueIds;

