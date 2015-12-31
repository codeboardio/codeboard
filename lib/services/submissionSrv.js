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
 * A collection of helper functions which are use to re-format the data from the database
 * @type {{getSubmissionDetailObject: Function}}
 * @private
 */
var _helperFunctions = {

  /** Function that returns an object containing details of a submission */
  getSubmissionDetailObject: function(submissionData) {
    return {
      submissionId: submissionData.get('submissionId'), // using get() because of https://github.com/sequelize/sequelize/issues/2360
      url: 'https://codeboard.io/api/projects/' + submissionData.projectId + '/submissions/' + submissionData.get('submissionId'),
      hasResult: submissionData.hasResult,
      testResult: submissionData.testResult,
      numTestsPassed: submissionData.numTestsPassed,
      numTestsFailed: submissionData.numTestsFailed,
      isLtiSubmission: (submissionData.ltiSessionId !== -1),
      createdAt: submissionData.createdAt
    };
  },


  /** Takes a submission object as retrieved from the DB and returns an object with user data that's 'not null' */
  getUserObject: function(submissionData) {
    if(submissionData.user === null) {
      return {
        userId: -1,
        username: '#anonymous'
      };

    }
    else {
      return {
        userId: submissionData.user.id, // could also use user.user.get('userId') because we rename in the queries
        username: submissionData.user.username
      };
    }
  }
};


/**
 * Retrieves submission data from the database. The resulting data is in a compact format that only lists how
 * many submissions each user has.
 *
 * @param projectId {Number} the projectId for which to retrieve the submission data
 * @param restrictToUserId {Number} set is to a number to restrict the query to a particular userId; otherwise set it to null;
 * @return {*} a Promise that resolves to Json array with submission data if the db query is successful
 */
var _getAllSubmissionsForProjectInCompactView = function(projectId, restrictToUserId) {

  // construct the where clause for the db query; it depends on whether we have a restrictToUserId argument
  var _whereClause = {
    projectId: projectId
  };

  // if we have an argument 'restrictToUserId', add it to the where clause
  if((typeof restrictToUserId !== 'undefined') && restrictToUserId !== null) {
    _whereClause.userId = restrictToUserId;
  }

   return db.Submission
    .findAll(
    {
      where: _whereClause,
      attributes: [[Sequelize.fn('count', Sequelize.col('Submission.id')), 'numOfSubmissions']],
      group: ['userId'],
      include: [
        {
          model: db.User, as: 'user',
          attributes: [['id', 'userId'], 'username']
        }
      ]
    })
    .then(function(submissions) {

       // Take care of the case where userId == -1 in the DB table.
       // Because of the 'order' in the query, if there's a 'user === null' (because of userId == -1 in DB)
       // it has to be at the first position of the array. We switch it to a more readable and consistent value.
       if(submissions[0].user === null) {
         submissions[0].user = submissions[0].dataValues.user = _helperFunctions.getUserObject(submissions[0]);
       }

       // return the submissions
       return submissions;
    });
};


/**
 * Retrieves submission data from the database. The resulting data is in a format that contains each submission
 * of every user.
 *
 * @param projectId {Number} the projectId for which to retrieve the submission data
 * @param restrictToUserId {Number} set is to a number to restrict the query to a particular userId; otherwise set it to null;
 * @return {*} a Promise that resolves to Json array with submission data if the db query is successful
 */
var _getAllSubmissionsForProjectInFullView = function(projectId, restrictToUserId) {

  // construct the where clause for the db query; it depends on whether we have a restrictToUserId argument
  var _whereClause = {
    projectId: projectId
  };

  // if we have an argument 'restrictToUserId', add it to the where clause
  if((typeof restrictToUserId !== 'undefined') && restrictToUserId !== null) {
    _whereClause.userId = restrictToUserId;
  }

  // the promise to fetch the data from the db
  return db.Submission
    .findAll(
    {
      attributes : [['id', 'submissionId'], 'ltiSessionId', 'hasResult', 'testResult', 'numTestsPassed', 'numTestsFailed', 'createdAt', 'projectId'],
      where: _whereClause,
      order: ['userId'],
      include: [
        {
          model: db.User, as: 'user',
          attributes: [['id', 'userId'], 'username']
        }
      ]
    })
    .then(function(submissions) {

      // we return an array (that might be empty)
      var result = [];

      // we initialize the variable to some value that certainly is not a valid userId
      // valid userIds are Numbers greater zero or null (null in case of 'userId == 1' in the DB)
      var lastSeenUserId = -42;

      // element in the result array
      var element;

      for(var i = 0; i < submissions.length; i++) {

        // get the value of the current userId
        var currentUserId = submissions[i].user !== null ? submissions[i].user.get('userId') : -1; // this takes care of the case where the user is null, that's when "userId == -1" in the database

        // is it the same as the previous one?
        if(currentUserId === lastSeenUserId) {
          // yes -> add to the submissions array
          element.submissions.push(_helperFunctions.getSubmissionDetailObject(submissions[i]));
        }
        else {
          // no -> create new object for that userId

          element = _helperFunctions.getUserObject(submissions[i]);
          element.submissions = [];

          // add the submission to that submissions array
          element.submissions.push(_helperFunctions.getSubmissionDetailObject(submissions[i]));

          // add the new element to the result array
          result.push(element);
        }

        // update the 'lastSeenUserId' variable
        lastSeenUserId = currentUserId;

      }

      return result;
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
  var _userId = restrictToUserId !== null ? Number(restrictToUserId) : null;
  if(_userId === NaN) {
    _userId = null;
  }

  if(viewType === 'compact') {
    return _getAllSubmissionsForProjectInCompactView(projectId, _userId);
  }
  else {
    return _getAllSubmissionsForProjectInFullView(projectId, _userId);
  }
};


var getSubmissionById = function(submissionId) {


  return db.Submission
    .find({
      attributes: [['id', 'submissionId'], 'ltiSessionId', 'hasResult', 'testResult', 'numTestsPassed', 'numTestsFailed', 'createdAt', 'projectId', 'userFilesDump', 'hiddenFilesDump'],
      where: {id: submissionId},
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: [['id', 'userId'], 'username']
        },
        {
          model: db.Project,
          as: 'project',
          attributes: ['id', 'projectname', 'language']
        }
      ]
    })
    .then(function(submission) {

      var result = {};

      if(submission !== null) {
        // found a submission with the given submissionId

        result = _helperFunctions.getSubmissionDetailObject(submission);
        result.userFilesDump = JSON.parse(submission.userFilesDump);
        result.hiddenFilesDump = JSON.parse(submission.hiddenFilesDump);

        result.project = {
          projectId: submission.project.id,
          projectname: submission.project.projectname,
          language: submission.project.language
        };


        // check if 'user == null', i.e. the userId for that submission was -1

        if(submission.user === null) {
          // overwrite the 'null' with the default user object for anonymous users
          result.user = _helperFunctions.getUserObject(submission);
        }
        else {
          result.user = submission.user;
        }
      }

      return result;
    });
};

exports.getAllSubmissionsForProject = getAllSubmissionsForProject;
exports.getSubmissionById = getSubmissionById;
