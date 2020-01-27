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
 * @returns {*} an array of promises
 */
var createFilesFromTemplateFiles = function(templateFiles) {

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
      isHidden: fileArray[i].isHidden,
      isStatic: fileArray[i].isStatic
    });

    result.push(promise);
  }

  return Promise.all(result);
};

/**
 * Creates a new project with the given parameters.
 * The new project is bootstrapped using the template that was defined for the language (e.g. Eiffel).
 * @param language the programming language of the project
 */
exports.createProjectFromTemplate = function(language) {

  console.log("createProjectFromTemplate");

  return db.TemplateProject.findOne(
    {
      where: {language: language},
      include: [
        {
          model: db.TemplateFile,
          as: 'fileSet'
        }
      ]
    })
      .then(function(templatePrj) {
        console.log("createFilesFromTemplateFiles");
        return createFilesFromTemplateFiles(templatePrj);
      })
      .error(function(err) {
        return -1;
      });
};
