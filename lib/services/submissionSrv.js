/**
 * Created by hce on 9/9/14.
 *
 * This service module provides a number of
 * utility functions for submissions of program solutions.
 *
 */
'use strict';


var db = require('../models'),
  Sequelize = require('sequelize');


/**
 * Retrieves submission data from the database. The resulting data is in a compact format that only lists how
 * many submissions each user has.
 *
 * @param args {Object} projectId: the projectId for which to retrieve the submission data
 *                      courseId: the courseId for which to retrieve the submission data
 *                      restrictToUserId: set is to a number to restrict the query to a particular userId; otherwise set it to null;
 * @return {*} a Promise that resolves to Json array with submission data if the db query is successful
 */
var _getSubmissionsInCompactView = function(args) {

  // define whereClause
  let _whereClause = {};

  // construct the where clause for the db query
  if (args.projectId) _whereClause.projectId = args.projectId;
  if (args.courseId) _whereClause.courseId = args.courseId;
  if (args.userId) _whereClause.userId = args.userId;

   return db.Submission.findAll({
      where: _whereClause,
      attributes: [[Sequelize.fn('count', Sequelize.col('Submission.id')), 'numOfSubmissions']],
      include: [ { model: db.User, as: 'user', attributes: [['id', 'userId'], 'username'] } ]
    });
};


/**
 * Retrieves submission data from the database. The resulting data is in a format that contains each submission
 * of every user.
 *
 * @param args {Object} projectId: the projectId for which to retrieve the submission data
 *                      courseId: the courseId for which to retrieve the submission data
 *                      restrictToUserId: set is to a number to restrict the query to a particular userId; otherwise set it to null;
 * @return {*} a Promise that resolves to Json array with submission data if the db query is successful
 */
var _getSubmissionsInFullView = function(args) {

  // define whereClause
  let _whereClause = {};

  // construct the where clause for the db query
  if (args.projectId) _whereClause.projectId = args.projectId;
  if (args.courseId) _whereClause.courseId = args.courseId;
  if (args.userId) _whereClause.userId = args.userId;

  // the promise to fetch the data from the db
  return db.Submission.findAll( {
      attributes : [['id', 'submissionId'], 'id', 'ltiSessionId', 'hasResult', 'testResult', 'numTestsPassed', 'numTestsFailed', 'createdAt', 'updatedAt', 'projectId'],
      where: _whereClause,
      include: [
          { model: db.User, as: 'user', attributes: [['id', 'userId'], 'username'] },
          { model: db.Project, as: 'project', attributes: [['id', 'projectId'], 'projectname'] }
      ]
    });
};


/**
 * Retrieves submission data for a given project.
 * @param projectId {Number} the projectId for which to retrieve the submission data
 * @param viewType {String} what form the submission data should have; leave empty or use 'compact' here
 * @param restrictToUserId {String} restrict the submission data to a particular userId; if not needed put null
 * @return {*} a Promise, resolving to the submission data if the retrieval from the db is successful
 */
var getAllSubmissionsForProject = function(projectId, viewType, restrictToUserId) {
  // check if restrictToUserId contains a number; we do this by formatting it from String to Number and checking for NaN
  let args = {
    projectId: projectId,
    userId: isNaN(Number(restrictToUserId)) ? Number(restrictToUserId) : null
  };
  return (viewType === 'compact') ? _getSubmissionsInCompactView(args) : _getSubmissionsInFullView(args);
};

/**
 * Returns help request data for a given course.
 * @param courseId {Number} the courseId for which to retrieve the help request data
 * @param viewType {String} what form the help request data should have; leave empty or use 'compact' here
 * @param restrictToUserId {String} restrict the help request  data to a particular userId; if not needed put null
 * @return {*} a Promise, resolving to the help request  data if the retrieval from the db is successful
 */
let getAllSubmissionsForCourse = function(courseId, viewType, restrictToUserId) {
  // check if restrictToUserId contains a number; we do this by formatting it from String to Number and checking for NaN
  let args = {
    courseId: courseId,
    userId: isNaN(Number(restrictToUserId)) ? Number(restrictToUserId) : null
  };
  return (viewType === 'compact') ? _getSubmissionsInCompactView(args) : _getSubmissionsInFullView(args);
};


/**
 * Returns help request data for a given course and a given project.
 * @param courseId {Number} the courseId for which to retrieve the help request data
 * @param projectId {Number} the projectId for which to retrieve the help request data
 * @param viewType {String} what form the help request data should have; leave empty or use 'compact' here
 * @param restrictToUserId {String} restrict the help request  data to a particular userId; if not needed put null
 * @return {*} a Promise, resolving to the help request  data if the retrieval from the db is successful
 */
let getAllSubmissionsForCourseProject = function(courseId, projectId, viewType, restrictToUserId) {
  // check if restrictToUserId contains a number; we do this by formatting it from String to Number and checking for NaN
  let args = {
    courseId: courseId,
    projectId: projectId,
    userId: isNaN(Number(restrictToUserId)) ? Number(restrictToUserId) : null
  };
  return (viewType === 'compact') ? _getSubmissionsInCompactView(args) : _getSubmissionsInFullView(args);
};


/**
 * Get submission by id
 * @param submissionId
 * @returns {Promise}
 */
var getSubmissionById = function(submissionId) {

  return db.Submission.findOne({
      attributes: [['id', 'submissionId'], 'ltiSessionId', 'hasResult', 'testResult', 'numTestsPassed', 'numTestsFailed', 'createdAt', 'updatedAt', 'projectId', 'userFilesDump', 'hiddenFilesDump'],
      where: {id: submissionId},
      include: [
        { model: db.User, as: 'user', attributes: [['id', 'userId'], 'username'] },
        { model: db.Project, as: 'project', attributes: ['id', 'projectname', 'language'] }
      ]
    })
    .then(function(submission) {

      var result = {};

      if(submission !== null) {
        // found a submission with the given submissionId

        result.submissionId= submission.get('submissionId'); // using get() because of https://github.com/sequelize/sequelize/issues/2360
        result.hasResult = submission.hasResult;
        result.testResult = submission.testResult;
        result.numTestsPassed = submission.numTestsPassed;
        result.numTestsFailed = submission.numTestsFailed;
        result.isLtiSubmission = (submission.ltiSessionId !== -1);
        result.createdAt = submission.createdAt;
        result.updatedAt = submission.updatedAt;

        result.userFilesDump = JSON.parse(submission.userFilesDump);
        result.hiddenFilesDump = JSON.parse(submission.hiddenFilesDump);

        result.project = {
          projectId: submission.project.id,
          projectname: submission.project.projectname,
          language: submission.project.language
        };

        result.user = submission.user;
      }

      return result;
    });
};

exports.getAllSubmissionsForProject = getAllSubmissionsForProject;
exports.getSubmissionById = getSubmissionById;
exports.getAllSubmissionsForCourseProject = getAllSubmissionsForCourseProject;
exports.getAllSubmissionsForCourse = getAllSubmissionsForCourse;
