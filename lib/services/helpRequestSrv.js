/**
 * This is our custom service for handling help requests
 *
 * @author Janick Michot
 *
 */

'use strict';


let db = require('../models'),
    Sequelize = require('sequelize');

/**
 * Retrieves help request data from the database. The resulting data is in a compact format that only lists how
 * many help requests each user has.
 *
 * @param args {Object} projectId: the projectId for which to retrieve the help request data
 *                      restrictToUserId: set is to a number to restrict the query to a particular userId; otherwise set it to null;
 * @return {*} a Promise that resolves to Json array with help requests data if the db query is successful
 */
let _getHelpRequestsInCompactView = function(args) {

    // define whereClause
    let _whereClause = {};

    // construct the where clause for the db query
    if (args.projectId) _whereClause.projectId = args.projectId;
    if (args.courseId) _whereClause.courseId = args.courseId;
    if (args.userId) _whereClause.userId = args.userId;

    return db.HelpRequest.findAll( {
        where: _whereClause,
        attributes: [[Sequelize.fn('count', Sequelize.col('HelpRequest.id')), 'numOfHelpRequests']],
        include: [ { model: db.User, as: 'user', attributes: [['id', 'userId'], 'username'] } ]
    });
};

/**
 * Retrieves help requests data from the database. The resulting data is in a format that contains each help request
 * of every user.
 *
 * @param projectId {Number} the projectId for which to retrieve the help request data
 * @param restrictToUserId {Number} set is to a number to restrict the query to a particular userId; otherwise set it to null;
 * @return {*} a Promise that resolves to Json array with help request data if the db query is successful
 */
let _getHelpRequestsInFullView = function(args) {

    // define whereClause
    let _whereClause = {};

    // construct the where clause for the db query
    if (args.projectId) _whereClause.projectId = args.projectId;
    if (args.courseId) _whereClause.courseId = args.courseId;
    if (args.userId) _whereClause.userId = args.userId;

    // the promise to fetch the data from the db
    return db.HelpRequest.findAll({
        attributes : [['id', 'helpRequestId'], 'ltiSessionId', 'status', 'createdAt', 'updatedAt', 'projectId'],
        where: _whereClause,
        order: ['userId'],
        include: [
            { model: db.User, as: 'user', attributes: [['id', 'userId'], 'username'] },
            { model: db.Project, as: 'project', attributes: [['id', 'projectId'], 'projectname'] }
        ]
    });
};


/**
 * Returns help request data for a given project.
 * @param projectId {Number} the projectId for which to retrieve the help request data
 * @param viewType {String} what form the help request data should have; leave empty or use 'compact' here
 * @param restrictToUserId {String} restrict the help request  data to a particular userId; if not needed put null
 * @return {*} a Promise, resolving to the help request  data if the retrieval from the db is successful
 */
let getAllHelpRequestsForProject = function(projectId, viewType, restrictToUserId) {
    // check if restrictToUserId contains a number; we do this by formatting it from String to Number and checking for NaN
    let args = {
        projectId: projectId,
        userId: isNaN(Number(restrictToUserId)) ? Number(restrictToUserId) : null
    };
    return (viewType === 'compact') ? _getHelpRequestsInCompactView(args) : _getHelpRequestsInFullView(args);
};


/**
 * Returns help request data for a given course.
 * @param courseId {Number} the courseId for which to retrieve the help request data
 * @param viewType {String} what form the help request data should have; leave empty or use 'compact' here
 * @param restrictToUserId {String} restrict the help request  data to a particular userId; if not needed put null
 * @return {*} a Promise, resolving to the help request  data if the retrieval from the db is successful
 */
let getAllHelpRequestsForCourse = function(courseId, viewType, restrictToUserId) {
    // check if restrictToUserId contains a number; we do this by formatting it from String to Number and checking for NaN
    let args = {
        courseId: courseId,
        userId: isNaN(Number(restrictToUserId)) ? Number(restrictToUserId) : null
    };
    return (viewType === 'compact') ? _getHelpRequestsInCompactView(args) : _getHelpRequestsInFullView(args);
};


/**
 * Returns help request data for a given course and a given project.
 * @param courseId {Number} the courseId for which to retrieve the help request data
 * @param projectId {Number} the projectId for which to retrieve the help request data
 * @param viewType {String} what form the help request data should have; leave empty or use 'compact' here
 * @param restrictToUserId {String} restrict the help request  data to a particular userId; if not needed put null
 * @return {*} a Promise, resolving to the help request  data if the retrieval from the db is successful
 */
let getAllHelpRequestsForCourseProject = function(courseId, projectId, viewType, restrictToUserId) {
    // check if restrictToUserId contains a number; we do this by formatting it from String to Number and checking for NaN
    let args = {
        courseId: courseId,
        projectId: projectId,
        userId: isNaN(Number(restrictToUserId)) ? Number(restrictToUserId) : null
    };

    console.log(args);
    return (viewType === 'compact') ? _getHelpRequestsInCompactView(args) : _getHelpRequestsInFullView(args);
};


/**
 * Returns a helpRequest by a given id
 * @param submissionId
 * @returns {Promise}
 */
let getHelpRequestById = function(helpRequestId) {

    return db.HelpRequest.findOne({
        attributes: [['id', 'helpRequestId'], 'ltiSessionId', 'status', 'createdAt', 'updatedAt', 'projectId', 'userFilesDump', 'hiddenFilesDump'],
        where: {id: helpRequestId},
        include: [
            { model: db.User, as: 'user', attributes: [['id', 'userId'], 'username'] },
            { model: db.Project, as: 'project', attributes: ['id', 'projectname', 'language'] }
        ]
    })
    .then(function(helpRequest) {

        let result = {};

        if(helpRequest !== null) {

            result.helpRequestId = helpRequest.get('helpRequestId');
            result.isLtiHelp = (helpRequest.ltiSessionId !== -1);
            result.createdAt = helpRequest.createdAt;
            result.updatedAt = helpRequest.updatedAt;
            result.projectName = helpRequest.project.projectname;
            result.status = helpRequest.status;

            result.userFilesDump = JSON.parse(helpRequest.userFilesDump);
            result.hiddenFilesDump = JSON.parse(helpRequest.hiddenFilesDump);

            result.project = {
                projectId: helpRequest.project.id,
                projectname: helpRequest.project.projectname,
                language: helpRequest.project.language
            };

            result.user = helpRequest.user;
        }

        return result;
    });
};


exports.getAllHelpRequestsForProject = getAllHelpRequestsForProject;
exports.getHelpRequestById = getHelpRequestById;
exports.getAllHelpRequestsForCourse = getAllHelpRequestsForCourse;
exports.getAllHelpRequestsForCourseProject = getAllHelpRequestsForCourseProject;