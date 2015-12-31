/**
 * Created by haches on 7/25/14.
 *
 * This service provides functionality that is
 * needed to creating a new template project.
 */

var db = require('../models'),
  Promise = require('bluebird');


/**
 * Returns an array promises where each promise relates to a file that's been created for the project.
 * @param templateFiles the template files that are used to create new files
 * @param language the language of the project
 * @param projectname the name of the project
 * @returns {*} an array of promises
 */
var createFilesFromTemplateFiles = function(templateFiles, language, projectname) {

  /* the result is an array of promisses */
  var result = [];

  var fileArray = templateFiles.dataValues.fileSet;

  for(var i in fileArray) {
    var promise = db.File.create({
      filename: fileArray[i].filename,
      path: fileArray[i].path,
      uniqueId: fileArray[i].uniqueId,
      parentUId: fileArray[i].parentUId,
      isFolder: fileArray[i].isFolder,
      content: fileArray[i].content,
      isHidden: fileArray[i].isHidden
    });

    result.push(promise);
  }

  return Promise.all(result);
};

/**
 * Creates a new project with the given parameters.
 * The new project is bootstrapped using the template that was defined for the language (e.g. Eiffel).
 * @param projectname name of the project
 * @param description a project description
 * @param language the programming language of the project
 * @param isPrivate set to true if the project should be private
 * @param usernameOfOwner the username of the person that will be the owner of the project
 */
exports.createProjectFromTemplate = function(projectname, description, language, isPrivate, usernameOfOwner) {

  /* local variable to keep a reference to the new project that was created in the database */
  var _generatedPrj = null;
  /* local variable to store the newly created project */
  var _newPrj;

  // create the basic project from the user's input
  var tmpPrj = {
    projectname: projectname,
    language: language,
    description: description,
    isPrivate: isPrivate,
    lastUId: 20 // TODO: this needs to be calculated based on the number of files in the project
  };


  return db.Project.create(tmpPrj)
    .then(function(newPrj) {
      _newPrj = newPrj;

      return db.TemplateProject.find(
        {
          where: {language: language},
          include: [
            {
              model: db.TemplateFile,
              as: 'fileSet',
              order: 'uniqueId ASC'
            }
          ]
        });
    })
    .then(function(templatePrj) {
      return createFilesFromTemplateFiles(templatePrj, language, projectname);
    })
    .then(function(newFiles) {
      return _newPrj.setFileSet(newFiles);
    }).
    then(function(files) {
      // we don't care about the files that are returned
      // but we still have to set the owner

      return db.User.find({where: {username: usernameOfOwner}});
    })
    .then(function(user) {
      return _newPrj.setOwnerSet([user]);
    })
    .then(function(ownerSet) {
      // we again don't care about the returned value here
      // just return the id of the newly created project
      return _newPrj.id;
    })
    .error(function(err) {
      return -1;
    });
};
