'use strict';

/**
 *
 * Created by haches on 6/9/14.
 *
 * The controller for handling requests related
 * to a project.
 *
 *
 */

const db = require('../models');
const util = require('util');
const _ = require('lodash');
const Sequelize = require('sequelize');
const Promise = require('bluebird');
const oauthSignature = require('oauth-signature');
const projectSrv = require('../services/projectSrv.js');
const submissionSrv = require('../services/submissionSrv.js');
const ltiSrv = require('../services/ltiSrv.js');
const templateSrv = require('../services/templateSrv.js');
const compilationSrv = require('../services/compilationSrv.js');
const mantraSrv = require('../services/mantraSrv.js');
const testingSrv = require('../services/testingSrv.js');
const ioTestingSrv = require('../services/ioTestingSrv.js');
const toolSrv = require('../services/toolSrv.js');
const logSrv = require('../services/logSrv.js');
const helpRequestSrv = require('../services/helpRequestSrv');
const errAndExcHelpSrv = require('../modules/errAndExcHelp/services/errAndExcHelpGenerationSrv');


/**
 * Function that only returns the information the current user is an authorized owner
 * of the project. Will return a 204 status code.
 *
 * Requires: mw.isValidProjectId && mw.isAuth && mw.isOwner
 */
var isAuthorizedOwner = function (req, res) {
  // we return a success but no data
  res.status(204).end();
};


var getAllProjects = function (req, res) {

  // determine the limit and the offset based on the query arguments
  // the offset determines at which row of the result we start
  // the limit determines how many rows (starting at offset + 1) are returned

  // optional query value that allows the user to filter based on a search term; default is empt
  var search = req.query.search || '';
  // optional query value for the page that should be displayed; default is 1
  var page = req.query.page || 1;
  // optional query parameter that sets how many results should (at maximum) be returned per page
  var limit_num_rows = req.query.per_page || 10;

  // we construct an where clause that enusre we find public projects that match the search terms
  var whereClause = [{isPrivate: false}];

  // we split the search string into separate words and concatenate the for the db query
  var searchTerms = search.split(' ');

  // all search terms need to be conncatenated; each term is disjoint on projectname, language, description
  for (var i = 0; i < searchTerms.length; i++) {

    var w = Sequelize.or(
        {projectname: {[Sequelize.Op.like]: '%' + searchTerms[i] + '%'}},
        {description: {[Sequelize.Op.like]: '%' + searchTerms[i] + '%'}},
        {language: {[Sequelize.Op.like]: '%' + searchTerms[i] + '%'}}
    );

    // add the w expression to the where clause
    whereClause.push(w);
  }

  db.Project
    .findAndCountAll( {
      attributes: ['id', 'projectname', 'description', 'language', 'createdAt'],
      where: whereClause,
      offset: (page - 1) * limit_num_rows, //calculate the offset based on the current page
      limit: limit_num_rows
    })
    .then(function(result) {

      // because of find all the result shouldn't be null but rather an array of lenght 0
      if(result === null || result.rows.length === 0) {

        res.status(422).json({
          status: '422',
          msg: 'There are no public projects that match all provided search terms.',
          searchTerms: searchTerms
        });

      } else {

        // the payload object we'll send back
        var resultPayload = {
          // number of projects that match the search criteria
          count: result.count,
          // array where an element is the project data to display
          projects: [],
          // by default we say there's no next project data to request
          hasNext: false,
          // the default uri in case someone makes a next request
          next: '/api/projects'
        };

        // determine if there's next project data that can be requested
        if (result.count > page * limit_num_rows) {
          resultPayload.hasNext = true;
          resultPayload.next = '/api/projects?'
            + 'page=' + (parseInt(page) + 1)
            + (search.length == 0 ? '' : '&search=' + encodeURIComponent(search));
        }

        // put together the data for each project
        for(var i = 0; i < result.rows.length; i++) {

          // data of a project
          var projectData = {
            id: result.rows[i].id,
            projectname: result.rows[i].projectname,
            language: result.rows[i].language,
            createdAt: result.rows[i].createdAt,
            description: projectSrv.getShortProjectDescription(result.rows[i].description, 250)
          };

          // add the project's data to the payload array
          resultPayload.projects.push(projectData);
        }

        res.status(200).json(resultPayload);
      }
    });
};


/**
 * Handles requests for featured projects. Returns a json object that
 * contains a json array with project data.
 */
var getAllFeaturedProjects = function (req, res) {

  //console.log('Invoke featured');


  db.Project
    .findAll( {
      attributes: ['id', 'projectname', 'description', 'language', 'createdAt'],
      where: {
        isPrivate: false,
        id: [8448, 8450, 8451, 8453, 8455, 8456, 8459] // TODO: here we're hard-coding which projects are featured ones
      }
    })
    .then(function(result) {

      // because of find all the result shouldn't be null but rather an array of length 0
      if(result === null || result.length === 0) {

        res.status(200).json({
          status: '200',
          msg: 'There are no featured projects.',
          projects: []
        });

      } else {

        // the payload object we'll send back
        var resultPayload = {
          // array where an element is the project data to display
          projects: []
        };

        for(var i = 0; i < result.length; i++) {

          // data of a project
          var projectData = {
            id: result[i].id,
            projectname: result[i].projectname,
            language: result[i].language,
            createdAt: result[i].createdAt,
            description: projectSrv.getShortProjectDescription(result[i].description, 250)
          };

          // add the project's data to the payload array
          resultPayload.projects.push(projectData);
        }

        res.status(200).json(resultPayload);
      }
    });
};


/**
 * Returns the data that is relevant for the settings of a project.
 * Assumes: user is authenticated, user is project owner
 */
var getProjectSettings = function (req, res) {

  // extract the id from the route
  var projectId = req.params.projectId;

  db.Project.findOne( {
      where: {id: projectId},
      attributes: ['id', 'projectname', 'description', 'language', 'code', 'isPrivate', 'isSubmissionAllowed', 'isLtiAllowed', 'ltiKey', 'ltiSecret'],
      include: [
        { model: db.User, as: 'ownerSet', attributes: ['username'] },
        { model: db.User, as: 'userSet', attributes: ['username'] },
        { model: db.Course, as: 'courseSet', required: false, attributes: ['id'] }
      ]
    })
    .then(function (prj) {
      logSrv.addPageLog(logSrv.events.accessProjectProfileEvent(req));
      res.status(200).json(prj);
    })
    .error(function (err) {
      console.log(err);
      res.sendStatus(500);
    });
};


var getProjectSummary = function (req, res) {

  // extract the id from the url
  var projectId = req.params.projectId;

  db.Project
    .findAll( {
      attributes: ['id', 'projectname', 'description', 'language', 'isPrivate', 'createdAt'],
      where: {id: projectId},
      include: [
        {model: db.User, as: 'ownerSet', attributes: ['username']}
      ]
    })
    .then(function(result) {

      // because of find all the result shouldn't be null but rather an array of length 0
      if(result !== null && result.length > 0) {
        res.status(200).json(result[0]); // return the first element in the array
      }
      else {
        res.status(404).json({msg: 'Project not found.'});
      }
    });
};


/**
 * Returns a full project, i.e. including the files that belong to it, for displaying in the IDE.
 * Assumes: the projectId in the route is valid
 */
var getFullProject = function (req, res) {

  // extract the id from the route
  var projectId = req.params.projectId;

  // extract the course id from the url parameters
  var courseId = parseInt(req.query.courseId);

  // if project id doesn't exist, show 404
  return db.Project.findOne( {
    where: {id: projectId},
    attributes: ['id', 'projectname', 'language', 'description', 'lastUId', 'isSubmissionAllowed'],
    include: [
      {
        model: db.Course,
        as: 'courseSet',
        attributes: ['coursename', 'contextId', 'description', 'id'],
        through: { attributes: [] },
        include: [
          { model: db.CourseOption, as: 'courseOptions', attributes: ['option', 'value'] }
        ]
      },
      { model: db.File, as: 'fileSet', required: false },
      { model: db.File, as: 'configFile', where: {filename: "codeboard.json"}, required: false }, // todo falls wir Konfiguration künftig ersetzen, hier Foreign-Table (bsp. `options`) laden (Janick, 16.01.20)
      { model: db.File, as: 'projectDescription', where: {filename: "projectDescription.html"}, required: false },
      { model: db.File, as: 'sampleSolution', where: {filename: "sampleSolution.html"}, required: false }
    ]
  })
    .then(function (prj) {

      if (prj === null)
        res.status(404).json({message: 'The project does not exist.'});
      else {
        /* logging */
        logSrv.addPageLog(logSrv.events.openFullProjectEvent(req));
        /* end of logging */

        // set the role of the user
        prj.dataValues.userRole = 'owner';

        // if a course id is set we copy into 'course'
        if(req.query.courseId && prj.courseSet.length > 0) {
          prj.dataValues.course = prj.courseSet.find((course) => course.id === courseId);
        }

        res.status(200).json(prj);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
};


/**
 * Returns a limited project, i.e. with files but without files that are marked as hidden.
 * Assumes: the projectId in the route is valid
 */
var getLimitedProject = function (req, res) {

  // extract the id from the route
  var projectId = req.params.projectId;

  // extract the course id from the url parameters
  var courseId = parseInt(req.query.courseId);

  // if project id doesn't exist, show 404
  return db.Project.findByPk(projectId, {
    attributes: ['id', 'projectname', 'language', 'description', 'lastUId', 'isSubmissionAllowed'],
    include: [
      {
        model: db.Course,
        as: 'courseSet',
        attributes: ['coursename', 'contextId', 'description', 'id'],
        through: { attributes: [] },
        include: [
          { model: db.CourseOption, as: 'courseOptions', attributes: ['option', 'value'] }
        ]
      },
      { model: db.File, as: 'fileSet', where: {isHidden: false} },
      { model: db.File, as: 'configFile', where: {filename: "codeboard.json"} },
      { model: db.File, as: 'projectDescription', where: {filename: "projectDescription.html"}, required: false },
      { model: db.File, as: 'sampleSolution', where: {filename: "sampleSolution.html"}, required: false }
    ]
  })
    .then(function (prj) {
      if (prj === null)
        res.status(404).json({message: 'The project does not exist.'});
      else {
        logSrv.addPageLog(logSrv.events.openLimitedProjectEvent(req));

        // set the role of the user
        prj.dataValues.userRole = "user";

        // we only want one course in a limited call
        if(req.query.courseId && prj.courseSet.length > 0) {
          prj.dataValues.course = prj.courseSet.find((course) => course.id === courseId);
        }
        delete prj.dataValues.courseSet; // we delete the courseSet in a limited call

        res.status(200).json(prj);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
};


/**
 * Get the version of a project as stored by a user (who's not the owner).
 * The user is identified via the auth cookie and NOT via the parameter :userId in the Url.
 * Assume: valid projectId
 * Assume: user is authenticated
 */
var getUserProject = function(req, res) {

  // Note: we actually don't use the :username from the Url.
  // The user is identified via the authorization cookie.
  // That also gives us direct access to the user's id which we use to lookup the user's version of the project.

  var projectId = req.params.projectId;
  var userId = req.user.id;

  // extract course id or get default value.
  var courseId = req.query.courseId || -1;

  return db.UserProject.findOne({
      where: {projectId: projectId, userId: userId, courseId: courseId},
      include: [
          { model: db.Course, as: 'course', attributes: ['id', 'coursename' ], include: [
              { model: db.CourseOption, as: 'courseOptions', attributes: ['option', 'value'] }
          ]}
      ]
    })
    .then(function(userProject) {

      if(userProject) {

        // check for successful submission
        db.Submission.findOne({
          where: {projectId: projectId, userId: userId, testResult: 1, courseId: (courseId < 0) ? null : courseId}
        })
          .then(function(submission) {

            // send back the user's version of the project
            res.status(200).json({
              project: {
                lastUId: userProject.lastUId,
                userProjectId: userProject.id
              },
              course: userProject.course,
              files: JSON.parse(userProject.files),
              projectCompleted: !!(submission)
            });
          });

      } else {
        // no project found, so we return a 404
        res.status(404).json({msg: "The current user doesn't have a version stored for project " + projectId});
      }
    });
};



/**
 * Function to update the settings of a project.
 * Requires: user is authenticated, user is project owner.
 */
var putProjectSettings = function (req, res) {

  const { check, validationResult } = require('express-validator');

  // first we validate the req
  check('projectname').not().isEmpty();
  check('language').not().isEmpty();
  check('isPrivate').not().isEmpty();
  check('ownerSet').not().isEmpty();

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.send(400, 'There have been validation errors: ' + util.inspect(errors));
  }

  // get the projectId
  var projectId = req.params.projectId;

  // find and update the project
  db.Project
    .findByPk(projectId)
    .then(function (prj) {

      prj.projectname = req.body.projectname;
      prj.description = req.body.description;
      prj.language = req.body.language;
      prj.isPrivate = req.body.isPrivate;
      prj.isSubmissionAllowed = req.body.isSubmissionAllowed;
      prj.isLtiAllowed = req.body.isLtiAllowed;
      prj.ltiKey = req.body.ltiKey;
      prj.ltiSecret = req.body.ltiSecret;

      return prj.save();

    })
    .then(function (prj) {
      // update the association for courses
      return projectSrv.setCoursesOfProject(prj, req.body.courseSet);
    })
    .then(function (prj) {
      // update the association for owners
      return projectSrv.setUsersAsOwners(prj, req.body.ownerSet);
    })
    .then(function (prj) {
      // update the association for users
      return projectSrv.setUsersAsUsers(prj, req.body.userSet);
    })
    .then(function () {
      logSrv.addPageLog(logSrv.events.updateProjectProfileEvent(req));
      res.status(200).json({message: 'Project data saved.'});
    })
    .error(function (err) {

      console.log(err);

      res.status(500).json({message: 'Error while saving project data.'});
    });
};


/**
 * Deletes a project.
 * Assumes: a valid projectId
 * Assumes: the user calling has the right to delete a project (e.g. is the owner)
 */
var deleteProject = function(req, res) {

  // get the projectId from the request
  var projectId = req.params.projectId;


  // TODO: the sequelize destroy() will delete a project and it's associated files
  // but it does not clean up the projectsOwners table or the projectsUsers table
  // this might be a bug that fixed in a newer version with onDelete: 'CASCADE'
  // TODO: test once upgrade to newer sequelizejs version

   db.Project
     .findByPk(projectId)
     .then(function(prj){
       // note: it's save to assume that the project exists because the route middelware checks it
       // delete the project
       return prj.destroy();
     })
     .then(function() {

       // the project was deleted successfully
       res.status(200).json({msg: 'Project deletion successful.'});
     })
     .catch(function(err) {
       console.log(err);

       res.status(500).json({msg: 'Failure while trying to delete the project.'});
     });
};


/**
 * Creates a new project for the authenticated user.
 * Assumes: user is authenticated
 */
var createProjectForUser = function (req, res) {

  // create tmp project
  let tmpPrj = {
    projectname: req.body.projectname,
    description: req.body.description,
    language: req.body.language,
    isPrivate: req.body.isPrivate || false,
    username: req.user.username,
    lastUId: 20 // TODO: this needs to be calculated based on the number of files in the project
  };

  // create new project
  return db.Project.create(tmpPrj)
      .then(function(project) {

        // create array for all promises used for defining project relations
        let projectRelations = [];

        // if project add template files
        projectRelations.push(templateSrv.createProjectFromTemplate(project.language).then(function(newFiles) {
          project.setFileSet(newFiles);
        }));

        // add owner set
        projectRelations.push(db.User.findOne({where: {username: tmpPrj.username}}).then(function(user) {
          project.setOwnerSet([user]);
        }));

        // promise all and return project id
        return Promise.all(projectRelations).then(function() {
          return project.id;
        });
      })
      .then(function(projectId) {

        if (projectId !== -1) {
          logSrv.addPageLog(logSrv.events.createProjectEvent(req, projectId ));
          res.status(201).json({message: 'Successfully created project.', id: projectId});
        }
        else {
          logSrv.addPageLog(logSrv.events.failedCreateProjectEvent(req));
          res.sendStatus(500);
        }

      })
      .catch(function(err) {
        console.log(err);
      });
};


/**
 * Updates a project that is identified through the :projectId in the URL.
 * @param req must have at least the properties 'files' with an array of files and 'project' that has information
 * about the 'lastUId'. Note that the function expects the files array to represent the full project. Files that
 * are not part of the request are treated as if they were deleted by the user and will be deleted from the database.
 * @param res a json response which is either 200 or 500
 */
var putProject = function (req, res) {

  // get the projectId
  var projectId = req.params.projectId;

  // variable to keep a reference to the project beyond the callback scope
  var project;

  // first we need to find out all the ids of the files that belong to project
  db.Project
    .findOne({
      where: {id: projectId},
      include: [
        {model: db.File, as: 'fileSet', attributes: ['id']}
      ]
    })
    .then(function (prj) {

      // store a reference to the project
      project = prj;

      // get all the ids of the files associate with the project
      var currentFileIds = [];
      for (var i in prj.fileSet)
        currentFileIds.push(prj.fileSet[i].dataValues.id);

      // get the file ids that are send with the request and have 'id > 0', i.e. they are an update of a file in the db
      var fileIdsInReq = [];
      for (var i in req.body.files)
        if (req.body.files[i].id > 0) fileIdsInReq.push(req.body.files[i].id);

      // get the ids that need to be deleted from the database by getting the set of file ids that are missing from the request
      var fileIdsToDelete = _.difference(currentFileIds, fileIdsInReq);

      // delete the files
      return projectSrv.removeFilesFromProject(fileIdsToDelete, project);
    })
    .then(function () {
      // the files that are part of the request and have 'id > 0', i.e. they belong to a file in the db and should be updated
      var filesToUpdate = [];
      for (var i in req.body.files)
        if (req.body.files[i].id > 0) filesToUpdate.push(req.body.files[i]);

      // update the files that need to be updated
      return projectSrv.updateExistingFiles(filesToUpdate, project);
    })
    .then(function () {
      // the files that need to be newly created
      var newFiles = [];
      for (var i in req.body.files)
        if (req.body.files[i].id < 0) newFiles.push(req.body.files[i]);

      // create the files that need to be created
      return projectSrv.addNewFiles(newFiles, project);

    })
    .then(function () {
        // we need to update the lastUId that was send as part of the request
        project.lastUId = req.body.project.lastUId;
        return project.save();
    })
    .then(function () {
      res.status(200).json({message: 'Project successfully updated.'});
    })
    .error(function (err) {
      console.log(err);
      res.status(500).json({message: 'Error while updating the project.'});
    });
};


/**
 * Save a a version of a project for a user (but not the owner of the project).
 * Assumes: a valid projectId
 * Assumes: the user is authenticated
 * Assumes: request body has lastUId info and files array
 */
var putProjectForUser = function (req, res) {

  // get the projectId
  var projectId = req.params.projectId;

  // get the courseId
  var courseId = req.body.courseId || -1;

  // get the user id?
  var userId = req.user.id;

  // if the user already has a saved version of the project we need to update it
  // otherwise we need to create a new saved version for the user
  return db.UserProject
    .findOrCreate({
      where: {projectId: projectId, userId: userId, courseId: courseId},
      defaults: {lastUId: req.body.project.lastUId, files: JSON.stringify(req.body.files), courseId: courseId}
    }).spread(function(userProject, created){

      var responseMsg = 'User project successfully saved.';

      if(created) {
        // there was no entry yet so a new one was created
        // send a 201 response that the user's project has been stored
        res.status(201).json({msg: responseMsg});

      } else {
        // there's already a version saved by the user, we updated it
        userProject.lastUId = req.body.project.lastUId;
        userProject.files = JSON.stringify(req.body.files);

        userProject.save().then(function() {
          // send response that user project was updated
          res.status(200).json({msg: responseMsg});
        }).catch(function(err) {

          // todo Error: Incorrect string value:
          //  Fehler wird bislang nich behandelt

          res.status(500).json({msg: "Fehler beim Speichern einer User-Version: " + JSON.stringify(err)});
        });
      }
    })
    .catch(function(err) {
      res.status(500).json({msg: "Fehler beim Speichern einer User-Version: " + JSON.stringify(err)});
    });
};


/**
 * Returns the projects for a user.
 * Depending if the user is looking at his own profile, a different set
 * of information is returned than when looking at some other users profile.
 */
var getUserProjects = function (req, res) {

  // the part of the URI that has the user name
  var requestedUser = req.params.username;

  if (req.isAuthenticated() && requestedUser === req.user.username) {
    // the user is authenticated and wants his own projects

    db.User.findOne({
      attributes: ['username', 'emailPublic', 'name', 'url', 'location', 'institution', 'imageUrl'],
      where: {username: req.user.username},
      include: [
        {
          model: db.Project, as: 'ownerSet', required: false,
          include: [
            // {model: db.User, as: 'ownerSet', attributes: ['username']}
            {model: db.User, as: 'userSet', attributes: ['username']}, // we no longer show the list of users; it makes the query too slow
            {model: db.Course, as: 'courseSet', attributes: ['coursename', 'id']} // we no longer show the list of users; it makes the query too slow
          ],
          attributes: ['id', 'projectname', 'language', 'description', 'createdAt', 'isPrivate']
        },
        {
          model: db.Project, as: 'userSet', required: false,
          attributes: ['id', 'projectname', 'language', 'description', 'createdAt', 'isPrivate']
        },
        {
          model: db.Course, as: 'courseOwnerSet', required: false,
          attributes: ['id', 'coursename', 'description', 'contextId', 'createdAt']
        },
        {
          model: db.Course, as: 'courseUserSet', required: false,
          attributes: ['id', 'coursename', 'description', 'contextId']
        }
      ]
    }).then(function (usr) {
        // it should be safe to assume that user!== null because otherwise the user would not be authenticated
        // thus we can directly create the object for returning

        // console.log('Server sends: \n' + JSON.stringify(usr, null, 4));
        res.status(200).json(usr);
      }).error(function (err) {
        console.log(err);
        res.status(500).json({message: 'Server error.'});
      });
  }
  else {
    // only get the public information of the requested user
    db.User.findAll( {
        where: {username: requestedUser},
        attributes: ['username', 'emailPublic', 'name', 'url', 'location', 'institution', 'imageUrl'],
        include: [
          {
            model: db.Project, where: {isPrivate: false}, required: false, as: 'ownerSet',
            include: [
              {model: db.User, as: 'ownerSet', attributes: ['username']}
            ],
            attributes: ['id', 'projectname', 'language', 'description', 'createdAt', 'isPrivate']
          }
        ]
      })
      .then(function (usr) {

        if(usr.length > 0) {
          //console.log('Server sends: \n' + JSON.stringify(usr[0], null, 4));
          res.status(200).json(usr[0]);
        }
        else {
          //console.log('User does not exist.')
          res.status(440).json({msg: 'The requested user does not exist'});
        }
      })
      .error(function (err) {
        console.log("Error retrieving user's project data: " + err);
        res.status(500).json({message: 'Server error.'});
      });
  }
};


/**
 * Post of a project; used for compilation, running, interfaceView, flatView, contractView,
 * classDescendants, classAncestors, classClients, classSuppliers, and featureCallers.
 * @param req req.body.action: action to perform
 * @param res
 */
var _runActionOnProject = function (req, res) {

  // the payload of the request
  var data = req.body;
  data.projectId = req.params.projectId;
  data.userId = req.user.id;

  // the actions that should be performed
  var action = data.action;

  // start the logs-timer to measure how long the request takes
  var start = logSrv.startTimer();

  if (action === 'compile' || action === 'compileAndRun') {
    compilationSrv.compile(data)
      .then(function(result) {
        logSrv.addActionLog(req, start, data, '');
        res.status(200).json(result);
      })
      .error(function (err) {
        // TODO: what and how are errors returned from the service?
        logSrv.addActionLog(req, start, data, " error compiling " + JSON.stringify(err));

        if(err && err.statusCode && err.msg) {
          res.status(err.statusCode).json({output: err.msg});
        }
        else {
          res.status(500).json({msg: 'Unknown error: ' + JSON.stringify(err)});
        }
      }).catch(function(a) {
          console.log(a);
    });
  }

  else if(action === 'test') {

    switch (data.testData.method) {
      case 'ioTest':
        ioTestingSrv.ioTestSingle(data)
            .then(function (testResult) {
              logSrv.addActionLog(req, start, data, '');
              res.send(testResult);
            }).catch(function(err) {
              logSrv.addActionLog(req, start, data, " error testing " + JSON.stringify(err));
              res.status(500).send(err);
            });
        break;

      // funktioniert nicht!!
      case 'unitTest':
        testingSrv.test(data, false)
            .then(function (result) {
              logSrv.addActionLog(req, start, data, '');
              res.send(result);
            }).error(function (err) {
          logSrv.addActionLog(req, start, data, " error testing " + JSON.stringify(err));
          res.send(500, err);
        });
        break;

      default:
        res.status(500).json( { output: "Keine Testdaten vorhanden" } );
      break;
    }
  }

  else if (action === 'tool') {
    toolSrv.tool(data)
      .then(function(result) {
        logSrv.addActionLog(req, start, data, '');
        res.send(result);
      }).
      error(function(err) {
        // the toolSrv will return an error object {statusCode:, msg: }
        if(err && err.statusCode && err.msg) {
          logSrv.addActionLog(req, start, data, " error tool action " + JSON.stringify(err));
          res.status(err.statusCode).json({msg: err.msg});
        }
        else if(err && err.message && err.name) {
          // in case a connection to the server can't even be established
          res.status(500).json({msg: err.message});
        }
      });
  }
  else {
    mantraSrv
      .executeCommand(data)
      .then(function(result) {
        logSrv.addActionLog(req, start, data, '');

        // TODO: with the new WS Mantra, we no longer have access to resut. How could we remove the testResult now?
        // check if the output contains a test result and if yes, we should remove it before sending it to the user
        //result.output = projectSrv.removeTestResult(result.output);

        // send the cleaned result
        res.status(200).json(result);
      })
      .error(function (err) {
        // and error was returned, e.g. a 404 that the project with the given id could not be run
        logSrv.addActionLog(req, start, data, " error other action " + JSON.stringify(err));

        if(err && err.statusCode && err.msg) {
          res.status(err.statusCode).json({msg: err.msg});
        }
        else {
          res.status(500).json({msg: 'Unknown error: ' + JSON.stringify(err)});
        }

      });
  }
};

/**
 * Executes an action (e.g. 'compile', 'run') on a project.
 * Because the caller has limited access to the project, the request will be merged with additional files or
 * data that is need to execute the requested action.
 * Assumes: projectId identifies a valid project
 * @param req request containing the files, the action etc.
 * @param res response that will be returned to the caller
 */
var runLimitedActionOnProgram = function (req, res) {

  // not all actions require to have the additional files, e.g. a 'run' action does not need it.
  // we introduce a condition here to check what the action is and act accordingly; is there a better way?

  // the id of project
  var projectId = req.params.projectId;

  if(req.body.action !== 'run') {
    // get additional files that are need to run the project (e.g. hidden files)
    projectSrv
        .getAllHiddenFilesOfProject(projectId, false)
        .then(function (hiddenFileSet) {

          // combine the files send by the user with any hidden files
          req.body.files = projectSrv.getCombinedFiles(hiddenFileSet, req.body.files);
          _runActionOnProject(req, res);
        });
  }
  else {
    _runActionOnProject(req, res);
  }
};


/**
 * Executes an action (e.g. 'compile', 'run') on a project.
 * @param req request containing the files, the action etc.
 * @param res response that will be returned to the caller
 */
var runActionOnProject = function (req, res) {
  // we don't have any additional files because the user should have send everything
  _runActionOnProject(req, res);
};



var startContainer = function startContainer (req, res, next) {
  mantraSrv.startContainer(req.url, req.params.mantraId, req.params.containerId)
    .then(function(result) {
      res.status(res.statusCode).json({msg: res.msg});
    })
    .catch(function(err) {
      res.sendStatus(err.statusCode);
    });
};


var stopContainer = function stopContainer (req, res, next) {

  mantraSrv.stopContainer(req.url, req.params.mantraId, req.params.containerId)
    .then(function(result) {
      res.status(res.statusCode).json({msg: res.msg});
    })
    .catch(function(err) {
      res.status(err.statusCode).json({msg: 'Error'});
    });
};


/**
 * Handles the initial POST request that comes from an
 * LTI tool consumer. The request contains various information
 * that we persist in the database as an LtiSession.
 * If the caller does not authenticate as a valid LTI tool consumer or
 * the called project does not allow for LTI access, a 401 is returned.
 * Assumes: - A :projectId in the route that is a valid project id.
 *          - The lti request is authorized
 */
var initLtiSession = function (req, res) {

  // the id of project
  var _projectId = req.params.projectId;

  // the contextId used to assign a session to a course
  var contextId = req.body.context_id;

  // check if a user is already logged in
  if(req.isAuthenticated() && typeof contextId !== "undefined") {

    // look for a course with the contextId sent from moodle
    return db.Course.findOne({
      where: { contextId: contextId}
    })
      .then(function(course) {

        // create lti session
        return db.LtiSession.create({
          UserId: req.user.id,
          ProjectId: _projectId,
          lisResultSourcedid: req.body.lis_result_sourcedid,
          lisOutcomeServiceUrl: req.body.lis_outcome_service_url,
          oauthNonce: req.body.oauth_nonce,
          oauthTimestamp: req.body.oauth_timestamp,
          oauthConsumerKey: req.body.oauth_consumer_key,
          oauthSignatureMethod: req.body.oauth_signature_method,
          oauthVersion: req.body.oauth_version,
          oauthSignature: req.body.oauth_signature,
          CourseId: (course !== null) ? course.id : null
        })
        .then(function (ltiSession) {
          if(ltiSession !== null) {
            return ltiSession;
          }
          else {
            return Promise.reject({statusCode: 500, msg: 'Error while creating an LTI session in the database.'});
          }
        })
        .then(function(ltiSession) {

          // we've store the information about this lti session, now we redirect
          // the redirect triggers a GET request for the project and has the parameters
          // the can be used to identify the lti session when the user submits her solution

          // encode the userId so we can put is a URL parameter
          var _userId = encodeURIComponent(req.body.user_id);

          // encode the return to course url so the user can return to the course page after successfully submitting solution
          var _returnUrl = encodeURIComponent(req.body.launch_presentation_return_url);

          // return a redirect; this will trigger a 'get' request for the project with parameters about the user and lti session
          var _uriParams = encodeURI('ltiSessionId=' + ltiSession.id + '&ltiUserId=' + _userId + '&ltiNonce=' + req.body.oauth_nonce + '&ltiReturnUrl=' + _returnUrl);


          // LTI allows the tool consumer, e.g. edX, to send custom parameters as part of the initial
          // LTI request. Those custom parameters are part of the req.body and are prefixed with "custom_".
          // See also https://www.imsglobal.org/specs/ltiv1p1p1/implementation-guide#toc-3
          // We want to extract any custom parameter and rewrite them to normal URL query strings so Codeboard can handle them.
          // All LTI custom parameters will start with the keyword "custom_" so we look for those.
          for (var propertyInReqBody in req.body) {
            if (propertyInReqBody.substr(0, 7) === 'custom_') {

              // get the parameter in from key=value (but remove the prefixed "custom_")
              var parameter = propertyInReqBody.substr(7) + '=' + req.body[propertyInReqBody];

              // append the parameter as a new uri parameter
              _uriParams += '&' + parameter;
            }
          }

          if(ltiSession.CourseId !== -1) {
            res.redirect('/courses/' + ltiSession.CourseId + '/projects/' + _projectId + '?' + _uriParams);
          } else {
            res.redirect('/projects/' + _projectId + '?' + _uriParams);
          }
        })
        .catch(function(err) {

          console.log('Error in projectjs.initLtiSession: ' + JSON.stringify(err));

          if(err && err.statusCode === 401) {
            res.status(401).json({msg: 'You are not authorized to access this page. Please check that this project allows for LTI access and that key/secret are correct.'});
          }
          else if (err && err.statusCode === 500) {
            res.status(500).json({msg: 'Error while creating an LTI session. Please try again. If the error persists, please contact support.'});
          }
          else {
            res.status(520).json({msg: 'An unknown error occurred. Please try again. If the error persists, please contact support.'});
          }
        });
      });
    } else {
      res.status(401).json({msg: 'You are not authorized to access this course.'});
  }
};

/**
 * todo löschen sobal neue funktion steht
 *
 * Handles the initial POST request that comes from an
 * LTI tool consumer. The request contains various information
 * that we persist in the database as an LtiSession.
 * If the caller does not authenticate as a valid LTI tool consumer or
 * the called project does not allow for LTI access, a 401 is returned.
 * Assumes: - A :projectId in the route that is a valid project id.
 *          - The lti request is authorized
 */
var _initLtiSession = function (req, res) {

  // the id of project
  var _projectId = req.params.projectId;

  // the lti POST might have a query string such as: /lti/project/17?view=1.0-2.1
  // we want to forward the query string as part of our redirect
  // to do this we rely on Node 'url' package to get access to the unparsed query string (using expressjs we would only get the parsed version)
  // see also: http://expressjs.com/4x/api.html#req.originalUrl
  // see also: https://nodejs.org/api/http.html#http_message_url
  var queryString = require('url').parse(req.originalUrl).query;

  /**
   * Function to check if a request from an LTI request for a project is authorized.
   * @param req the request that was send by the LTI tool consumer (e.g. edX or Moodle)
   * @return {boolean} returns true it the oauth_signature matches with the LTI settings
   */
  var isRequestAuthorized = function (req, ltiSecret) {

    // get all the properties of the body, except for the one that's 'oauth_signature'
    var _parameters = {};

    for (var property in req.body) {
      if (property !== 'oauth_signature') {
        _parameters[property] = req.body[property];
      }
    }

    // for oauth we need the method that was used for this request
    var _httpMethod = req.method;

    // Note: usually we would get the protocol through 'req.protocol'; in production we're behind a load balancer and thus LTI-Tool-Consumers use https but req.protocol will be http
    var protocol = req.protocol;
    if(process.env.NODE_ENV && process.env.NODE_ENV === 'production') {
      protocol = 'https';
    }
    // for oauth we need the full url that was used for this request
    var _url = protocol + '://' + req.get('host') + req.originalUrl;

    // for oauth we need the secret from the database (the lti key is part of the request already)
    var _consumerSecret = ltiSecret;
    // for oauth we need to put the tokenSecret property, even if we don't use it
    var _tokenSecret = '';

    // generate the signature for the request
    var _encodedSignature = oauthSignature.generate(_httpMethod, _url, _parameters, _consumerSecret, _tokenSecret);

    // check if the signature of the request matches the signature we calculated
    // Note: we decode the percentage encoding of the the calculated signature
    return (req.body.oauth_signature === oauthSignature.Rfc3986.prototype.decode(_encodedSignature));
  };


  // after retrieving a project form the DB, we need to keep a reference to the project object
  var _prj;
  // after creating a ltiSession in the DB, we need to keep the reference to the ltiSession object
  var _ltiSession;

  // start by looking up the project details, especially regarding the lti settings
  db
    .Project
    .findByPk(_projectId)
    .then(function (prj) {

      // check if lti is enabled for this project and if the caller is authorized by knowing the key and secret
      if (!prj.isLtiAllowed || !isRequestAuthorized(req, prj.ltiSecret)) {
        // the caller is not an authorized LTI tool consumer
        return Promise.reject({statusCode: 401, msg: 'The project does not allow access via LTI or the provided key/secret combination is wrong.'});
      }
      else {

        // store a reference to the project object
        _prj = prj;

        // the caller is an authorized LTI tool consumer so we create a db entry for the request
        return db
          .LtiSession
          .create({
            userId: req.body.user_id,
            lisResultSourcedid: req.body.lis_result_sourcedid,
            lisOutcomeServiceUrl: req.body.lis_outcome_service_url,
            oauthNonce: req.body.oauth_nonce,
            oauthTimestamp: req.body.oauth_timestamp,
            oauthConsumerKey: req.body.oauth_consumer_key,
            oauthSignatureMethod: req.body.oauth_signature_method,
            oauthVersion: req.body.oauth_version,
            oauthSignature: req.body.oauth_signature
          });
      }
    })
    .then(function (ltiSession) {

      // we need to associate a project with each ltiSession (through a foreign key)
      if(ltiSession !== null) {
        _ltiSession = ltiSession;
        return ltiSession.setProject(_prj);
      }
      else {
        return Promise.reject({statusCode: 500, msg: 'Error while creating an LTI session in the database.'});
      }
    })
    .then(function() {

      // we've store the information about this lti session, now we redirect
      // the redirect triggers a GET request for the project and has the parameters
      // the can be used to identify the lti session when the user submits her solution

      // encode the userId so we can put is a URL parameter
      var _userId = encodeURIComponent(req.body.user_id);

      // return a redirect; this will trigger a 'get' request for the project with parameters about the user and lti session
      var _uriParams = encodeURI('ltiSessionId=' + _ltiSession.id + '&ltiUserId=' + _userId + '&ltiNonce=' + req.body.oauth_nonce);


      // LTI allows the tool consumer, e.g. edX, to send custom parameters as part of the initial
      // LTI request. Those custom parameters are part of the req.body and are prefixed with "custom_".
      // See also https://www.imsglobal.org/specs/ltiv1p1p1/implementation-guide#toc-3
      // We want to extract any custom parameter and rewrite them to normal URL query strings so Codeboard can handle them.
      // All LTI custom parameters will start with the keyword "custom_" so we look for those.
      for (var propertyInReqBody in req.body) {
        if (propertyInReqBody.substr(0, 7) === 'custom_') {

          // get the parameter in from key=value (but remove the prefixed "custom_")
          var parameter = propertyInReqBody.substr(7) + '=' + req.body[propertyInReqBody];

          // append the parameter as a new uri parameter
          _uriParams += '&' + parameter;
        }
      }

      res.redirect('/projects/' + _projectId + '?' + _uriParams);
    })
    .catch(function(err) {

      console.log('Error in projectjs.initLtiSession: ' + JSON.stringify(err));

      if(err && err.statusCode === 401) {
        res.status(401).json({msg: 'You are not authorized to access this page. Please check that this project allows for LTI access and that key/secret are correct.'});
      }
      else if (err && err.statusCode === 500) {
        res.status(500).json({msg: 'Error while creating an LTI session. Please try again. If the error persists, please contact support.'});
      }
      else {
        res.status(520).json({msg: 'An unknown error occurred. Please try again. If the error persists, please contact support.'});
      }
    });
};


/**
 * Handles a new submission.
 * Assumes: a valid projectId in the route at :projectId
 */
var createSubmission = function (req, res) {

  let projectId = req.params.projectId;
  let courseId = req.body.course.id ? req.body.course.id : null;
  let userId = req.user ? req.user.id : -1;

  let data = req.body;

  // additional data used for compilation tests
  data.projectId = projectId;
  data.userId = userId;
  data.courseId = courseId;

  // we store the hidden files as part of a helpRequest
  // this guarantees that a teacher can check a submission exactly as it was when a student submitted
  let _hiddenFileSet = [];

  // load hidden files
  projectSrv.getAllHiddenFilesOfProject(projectId, false)
      .then(function (hiddenFileSet) {

        // store the hidden files; we need to save them to the submission table later on
        _hiddenFileSet = hiddenFileSet;

        // combine the files send by the user with any hidden files
        data.files = projectSrv.getCombinedFiles(hiddenFileSet, req.body.files);

        // check for prev submissions
        return ioTestingSrv.testProjectForSubmission(data)
      })
      .then(function (testResult) {

        let ioTests = testResult.ioTests
        let hasResult = (testResult.ioTests.length > 0);
        let numTestsPassed = ioTests.filter(test => test.status === 'success').length;
        let numTestsFailed = ioTests.filter(test => test.status !== 'success').length;
        let result = ioTests.length ? (1 / ioTests.length) * numTestsPassed : 0;

        return submissionSrv.getSubmissions(projectId, userId, courseId, {"testResult": result})
            .then(function (prevSubmissions) {

              let submitToLti = prevSubmissions.length === 0;

              // todo differentiate dynamic and non dynamic languages. Compilation not needed for dynamic

              // the record that we'll store in the database, initialized with reasonable default values
              var _submissionRecord = {
                projectId: projectId,
                hasResult: false,
                testResult: -1,
                numTestsPassed: -1,
                numTestsFailed: -1,
                userId: -1,
                ltiSessionId: -1,
                userFilesDump: JSON.stringify(data.filesInDefaultFormat),
                hiddenFilesDump: data.userRole === 'owner' ? JSON.stringify([]) : JSON.stringify(_hiddenFileSet),
                courseId: null // todo -1 not working here
              };

              // set the course id if one is set
              _submissionRecord.courseId = req.body.course.id ? req.body.course.id : _submissionRecord.courseId;

              // set the user id in case the user is actually logged in
              _submissionRecord.userId = req.user ? req.user.id : _submissionRecord.userId;

              // if the submission is has LTI data then store the ltiSubmissionId
              _submissionRecord.ltiSessionId = req.body.hasLtiData ? req.body.ltiData.ltiSessionId : _submissionRecord.ltiSessionId;

              _submissionRecord.hasResult = hasResult
              _submissionRecord.numTestsPassed = numTestsPassed
              _submissionRecord.numTestsFailed = numTestsFailed
              _submissionRecord.testResult = result

              return db.Submission.create(_submissionRecord)
                  .then(function (submissionRecord) {

                    // if we have a grade & the submission has Lti data, we need to forward the grade to the LTI consumer
                    if (submitToLti && submissionRecord.hasResult && submissionRecord.ltiSessionId !== -1) {

                      // we can get the ltiSubmissionId
                      let _ltiId = submissionRecord.ltiSessionId;
                      let _ltiUserId = req.body.ltiData.ltiUserId ? req.body.ltiData.ltiUserId : -1;
                      let _ltiNonce = req.body.ltiData.ltiNonce ? req.body.ltiData.ltiNonce : -1;

                      ltiSrv.submitGradeToLtiToolConsumer(projectId, _ltiId, _ltiUserId, _ltiNonce, submissionRecord.testResult)
                          .then(function (result) {
                            let status = (result.success) ? 200 : 500;
                            res.status(status).json({msg: result.msg, data: submissionRecord.dataValues});
                          });
                    } else {
                      res.status(200).json({
                        msg: 'Your solution was successfully submitted. (2)',
                        data: submissionRecord.dataValues
                      });
                    }
                  })
            })
      })
      .catch(function (err) {
        if (err && err.statusCode && err.msg) {
          // all Mantra API calls would provide a statusCode and msg in case an error happend
          res.status(err.statusCode).json({msg: err.msg});
        } else {
          // something else must have thrown the error. try to return the best error message possible
          res.status(500).json({msg: (err.hasOwnProperty('msg')) ? err.msg : err.toString()});
        }
      });
};

/**
 * Returns all submissions for a given projectId.
 * Assumes: a valid :projectId
 * Assumes: it's established that the request was made a legit owner of the project
 */
var getAllSubmissions = function(req, res) {

  // get the projectId from the Url path
  var projectId = req.params.projectId;
  // there could be a query ?view=compact
  var _viewQuery = typeof req.query.view !== 'undefined' ? req.query.view : null;
  // there could be a query ?userId=someUserId
  var _userIdQuery = typeof req.query.userId !== 'undefined' ? req.query.userId : null;

  submissionSrv.getAllSubmissionsForProject(projectId, _viewQuery, _userIdQuery)
    .then(function(data) {
      res.status(200).json(data);
    })
    .catch(function(err) {
      console.log(err);
      res.status(500).json({msg: 'Error while fetching submission data.'});
    });
};


var getSubmission = function (req, res) {

  var submissionId = req.params.submissionId;

  submissionSrv.getSubmissionById(submissionId)
    .then(function(submission) {

      // we could add this information here or on the client; what's better?
      submission.userRole = 'submission';

      res.status(200).json(submission);
    })
    .catch(function(err) {
      res.status(500).json({msg: 'Error retrieving the submission with id ' + submissionId});
    });
};


// todo eigene Controller/Services für Help erstellen

/**
 * Create a new help request
 * @author Janick Michot
 *
 * @param req
 * @param res
 */
let createHelpRequest = function(req, res) {

  let projectId = req.params.projectId,
      data = req.body;

  // we store the hidden files as part of a helpRequest
  // this guarantees that a teacher can check a submission exactly as it was when a student submitted
  let _hiddenFileSet = [];

  // load hidden files
  projectSrv.getAllHiddenFilesOfProject(projectId, false)
    .then(function (hiddenFileSet) {

      // store the hidden files; we need to save them to the submission table later on
      _hiddenFileSet = hiddenFileSet;

      // todo maybe check if the project is part of the course or add another middleware isProjectPartOf

      // create help request record
      let _requestHelpRecord = {
        status: 'unanswered',
        userFilesDump: JSON.stringify(data.filesInDefaultFormat),
        hiddenFilesDump: data.userRole === 'owner' ? JSON.stringify([]) : JSON.stringify(_hiddenFileSet),
        projectId: projectId,
        userId: req.user ? req.user.id : -1,
        ltiSessionId: data.hasLtiData ? data.ltiData.ltiSessionId : -1,
        courseId: data.courseId ? data.courseId : null
      };

      // create request and return result
      return db.HelpRequest.create(_requestHelpRecord);
    })
      .then(function(request) {
        res.status(200).json(request);
      })
      .catch(function(err) {
          console.log(err);
        res.status(500).json({msg: 'Error while create a help request.'});
      });
};

/**
 * Update a new help request
 *
 * @author Janick Michot
 *
 * @param req
 * @param res
 */
let updateHelpRequest = function(req, res) {

  db.HelpRequest.findByPk(req.body.helpRequestId)
      .then(function(helpRequest) {
        if(helpRequest) {
          helpRequest.status = req.body.status;
          helpRequest.save()
              .then(function () {
                res.status(200).json(helpRequest);
              });
        } else {
          res.status(500).json({msg: 'Error while create a help request: Id is invalid'});
        }
      })
      .catch(function(err) {
          console.log(err);
          res.status(500).json({msg: 'Error while updating a help request.'});
      });
};

/**
 * Returns all help requests for a given projectId.
 * Assumes: a valid :projectId
 * Assumes: it's established that the request was made a legit owner of the project
 * @author Janick
 */
let getAllHelpRequests = function(req, res) {

  // get the projectId from the Url path
  var projectId = req.params.projectId;
  // there could be a query ?view=compact
  var _viewQuery = typeof req.query.view !== 'undefined' ? req.query.view : null;
  // there could be a query ?userId=someUserId
  var _userIdQuery = typeof req.query.userId !== 'undefined' ? req.query.userId : null;


  submissionSrv.getAllSubmissionsForProject(projectId, _viewQuery, _userIdQuery)
      .then(function (submissions) {
        return helpRequestSrv.getAllHelpRequestsForProject(projectId, _viewQuery, _userIdQuery)
            .then(function (data) {
              data.forEach(function (helprequest) {
                var bestSubmission = submissions.filter(submission => submission.user.userId === helprequest.user.userId).reduce((prev, current) => {
                  return (current.testResult > prev.testResult) ? current : prev;
                }, {testResult: -Infinity});

                helprequest.dataValues.bestSubmission = bestSubmission;
              });
              return data;
            });
      })
      .then(function (data) {
        res.status(200).json(data);
      })
      .catch(function(err) {
        console.log(err);
        res.status(500).json({msg: 'Error while fetching submission data.'});
      });
};

/**
 *
 * @author Janick Michot
 * @param req
 * @param res
 */
let getHelpRequest = function (req, res) {
  let helpRequestId = req.params.helpRequestId;
  helpRequestSrv.getHelpRequestById(helpRequestId)
      .then(function(helpRequest) {
        helpRequest.userRole = 'help';
        res.status(200).json(helpRequest);
      })
      .catch(function(err) {
        console.log(err);
        res.status(500).json({msg: 'Error retrieving the submission with id ' + helpRequestId});
      });
};


var getAllUserProjectsForProject = function(req, res) {

  var _projectId = req.params.projectId;

  db.UserProject.findAll({
      attributes: ['id', 'updatedAt', 'isLastStoredByOwner', 'projectId'],
      where: {projectId: _projectId},
      include: [
        { model: db.User, as: 'user', attributes: [['id', 'userId'], 'username'] },
        { model: db.Project, as: 'project', attributes: [['id', 'projectId'], 'projectname'] }
      ],
      order: [['updatedAt', 'asc']]
    })
    .then(function(result) {
      res.status(200).json(result);
    });
};


/**
 * Gets the a userproject (a version of a project that was saved by user) and combines it with hidden files
 * and other project information such that is a full project that can be inspected by an owner.
 *
 * Assumes: the combination of :projectId and :userprojectId is valid (the two must be from the same row in in the db)
 * (check implemented in mw.isValidProjectIdAndUserprojectIdCombo)
 *
 * @param req
 * @param res
 */
var getUserProjectForProject = function(req, res) {

  // extract the projectId from the route
  var _projectId = req.params.projectId;

  // extract the userprojectId from the route
  var _userprojectId = req.params.userprojectId;

  // variable to store the userProject retrieved from the DB
  var _userProject;

  db.UserProject.findOne({
      where: {id: _userprojectId},
      attributes: ['id', 'lastUId', 'files', 'updatedAt'],
      include: [
        { model: db.Project, as: 'project', attributes: ['id', 'projectname', 'language', 'description', 'isSubmissionAllowed'] },
        { model: db.User, as: 'user', attributes: ['id', 'username'] },
        { model: db.Course, as: 'course', attributes: ['id', 'coursename'], required: false }
      ]
    })
    .then(function(aUserProject) {

      // save the userProject
      _userProject = aUserProject;

      // the userProject will not contain any hidden files; we need to fetch them separately
      return db.Project.findOne({
          where: {id: _projectId},
          include: [{
              model: db.File,
              as: 'fileSet',
              where: {isHidden: true},  // Note: here we only get hidden files because we combine those with the non-hidden files that the user stored.
              attributes: ['id', 'filename', 'path', 'uniqueId', 'parentUId', 'isFolder', 'content', 'isHidden', 'isStatic']
          }]
        });
    })
    .then(function(aProjectHiddenFiles) {

      // check if there are any hidden files: if yes, make the part of the project property
      if (aProjectHiddenFiles) {
        _userProject.project.fileSet = aProjectHiddenFiles.fileSet;
      } else {
        // attach an empty array so we can concatenate arrays later on
        _userProject.project.fileSet = [];
      }

      return _userProject;
    })
    .then(function(aFullUserProject){
      if(!(aFullUserProject)) {
        // result shouldn't be null or any false value but we check to catch unexpected problems
        return Promise.reject({statusCode: 500, msg: 'Error retrieving userProject with id ' + _userprojectId + ' for project with id ' + _projectId});
      }
      else {
        // we have a userProject; now construct the payload in a format that's expected by the client
        var _payload = {
          userprojectId: aFullUserProject.id,
          projectId: aFullUserProject.project.id,
          projectname: aFullUserProject.project.projectname,
          language: aFullUserProject.project.language,
          description: aFullUserProject.project.description,
          lastUId: aFullUserProject.lastUId,
          isSubmissionAllowed: false,
          fileSet: JSON.parse(aFullUserProject.files).concat(aFullUserProject.project.fileSet),
          course: aFullUserProject.course,
          userRole: 'userproject',
          username: aFullUserProject.user.username,
          updatedAt: aFullUserProject.updatedAt
        };

        // the uniqueIds of user files and hidden files might overlap; we recalculate them
        var fixedIds = projectSrv.recalculateUniqueIds(_payload.fileSet);

        // update the payload with the recalculated file ids
        _payload.fileSet = fixedIds.fileSet;
        _payload.lastUId = fixedIds.lastUId;

        res.status(200).json(_payload);
      }
    })
    .catch(function(err) {
      console.log(err);
      res.status(500).json({msg: err.msg});
    });
};


/**
 * This method takes a compilation result together with the meta data used for compilation in order
 * to generate a help message for an exception or error.
 *
 * @param req
 * @param res
 */
let getHelpForCompilation = function(req, res) {

  const projectId = req.params.projectId;
  const data = req.body;

  errAndExcHelpSrv.getHelpForCompilationErrors(data.compilation.output, data.language, req.user.id, data.courseId)
      .then(function(response) {
        res.status(200).send(response);
      })
      .catch(function(err) {
        res.status(500).json({msg: "Get help for compilation error failed", err: err});
      });
};




module.exports = {
  isAuthorizedOwner: isAuthorizedOwner,
  getAllProjects: getAllProjects,
  getAllFeaturedProjects: getAllFeaturedProjects,
  getProjectSettings: getProjectSettings,
  getProjectSummary: getProjectSummary,
  getFullProject: getFullProject,
  getLimitedProject: getLimitedProject,
  getUserProject: getUserProject,
  putProjectSettings: putProjectSettings,
  deleteProject: deleteProject,
  createProjectForUser: createProjectForUser,
  putProject: putProject,
  putProjectForUser: putProjectForUser,
  getUserProjects: getUserProjects,
  runLimitedActionOnProject: runLimitedActionOnProgram,
  runActionOnProject: runActionOnProject,
  startContainer: startContainer,
  stopContainer: stopContainer,
  initLtiSession: initLtiSession,
  createSubmission: createSubmission,
  getAllSubmissions: getAllSubmissions,
  getSubmission: getSubmission,
  createHelpRequest: createHelpRequest,
  updateHelpRequest: updateHelpRequest,
  getAllHelpRequests: getAllHelpRequests,
  getHelpRequest: getHelpRequest,
  getAllUserProjectsForProject: getAllUserProjectsForProject,
  getUserProjectForProject: getUserProjectForProject,
  getHelpForCompilation: getHelpForCompilation
};

