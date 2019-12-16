/**
 * This is our custom service for handling help requests
 *
 * @author Janick Michot
 *
 */

'use strict';


let db = require('../models'),
    Sequelize = require('sequelize'),
    config = require('../config/config.js');


/**
 * A collection of helper functions which are use to re-format the data from the database
 * Copied from `submissionSrv`
 * @type {{getHelpRequestDetailObject: Function}}
 * @private
 */
var _helperFunctions = {

    /** Function that returns an object containing details of a help request  */
    getHelpRequestDetailObject: function(helpRequestData) {
        return {
            helpRequestId: helpRequestData.get('helpRequestId'), // using get() because of https://github.com/sequelize/sequelize/issues/2360
            isLtiHelp: (helpRequestData.ltiSessionId !== -1),
            createdAt: helpRequestData.createdAt,
            projectName: helpRequestData.project.projectname,
            status: helpRequestData.status
        };
    },

    /** Takes a help request object as retrieved from the DB and returns an object with user data that's 'not null' */
    getUserObject: function(helpRequestData) {
        return (helpRequestData.user === null) ? { userId: -1, username: '#anonymous' } : { userId: helpRequestData.user.id, username: helpRequestData.user.username };
    }
};


/**
 * Retrieves help request data from the database. The resulting data is in a compact format that only lists how
 * many help requests each user has.
 *
 * @param projectId {Number} the projectId for which to retrieve the help request data
 * @param restrictToUserId {Number} set is to a number to restrict the query to a particular userId; otherwise set it to null;
 * @return {*} a Promise that resolves to Json array with help requests data if the db query is successful
 */
let _getAllHelpRequestsForProjectInCompactView = function(projectId, restrictToUserId) {

    // construct the where clause for the db query; it depends on whether we have a restrictToUserId argument
    var _whereClause = {
        projectId: projectId
    };

    // if we have an argument 'restrictToUserId', add it to the where clause
    if((typeof restrictToUserId !== 'undefined') && restrictToUserId !== null) {
        _whereClause.userId = restrictToUserId;
    }

    return db.HelpRequest
        .findAll(
            {
                where: _whereClause,
                attributes: [[Sequelize.fn('count', Sequelize.col('HelpRequest.id')), 'numOfHelpRequests']],
                group: ['userId'],
                include: [
                    {
                        model: db.User, as: 'user',
                        attributes: [['id', 'userId'], 'username']
                    }
                ]
            })
        .then(function(helpRequests) {

            // Take care of the case where userId == -1 in the DB table.
            // Because of the 'order' in the query, if there's a 'user === null' (because of userId == -1 in DB)
            // it has to be at the first position of the array. We switch it to a more readable and consistent value.
            if(helpRequests[0].user === null) {
                helpRequests[0].user = helpRequests[0].dataValues.user = _helperFunctions.getUserObject(helpRequests[0]);
            }

            return helpRequests;
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
let _getAllHelpRequestsForProjectInFullView = function(projectId, restrictToUserId) {

    // construct the where clause for the db query; it depends on whether we have a restrictToUserId argument
    let _whereClause = {
        projectId: projectId
    };

    // if we have an argument 'restrictToUserId', add it to the where clause
    if((typeof restrictToUserId !== 'undefined') && restrictToUserId !== null) {
        _whereClause.userId = restrictToUserId;
    }

    // the promise to fetch the data from the db
    return db.HelpRequest
        .findAll(
            {
                attributes : [['id', 'helpRequestId'], 'ltiSessionId', 'status', 'userNote', 'teacherNote', 'createdAt', 'projectId'],
                where: _whereClause,
                order: ['userId'],
                include: [
                    {
                        model: db.User, as: 'user',
                        attributes: [['id', 'userId'], 'username']
                    },
                    {
                        model: db.Project, as: 'project',
                        attributes: [['id', 'projectId'], 'projectname']
                    }
                ]
            })
        .then(function(helpRequests) {

            console.log(helpRequests);
            console.log(helpRequests[0].project);
            console.log(helpRequests[0].user);


            // we return an array (that might be empty)
            let result = [];

            // we initialize the variable to some value that certainly is not a valid userId
            // valid userIds are Numbers greater zero or null (null in case of 'userId == 1' in the DB)
            let lastSeenUserId = -42;

            // element in the result array
            let element;

            for(let i = 0; i < helpRequests.length; i++) {

                // get the value of the current userId
                let currentUserId = helpRequests[i].user !== null ? helpRequests[i].user.get('userId') : -1; // this takes care of the case where the user is null, that's when "userId == -1" in the database

                // is it the same as the previous one?
                if(currentUserId === lastSeenUserId) {
                    // yes -> add to the help request array
                    element.helpRequests.push(_helperFunctions.getHelpRequestDetailObject(helpRequests[i]));
                }
                else {
                    // no -> create new object for that userId

                    element = _helperFunctions.getUserObject(helpRequests[i]);
                    element.helpRequests = [];

                    // add the help request to that help requests array
                    element.helpRequests.push(_helperFunctions.getHelpRequestDetailObject(helpRequests[i]));

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
 * Retrieves help request data for a given project.
 * @param projectId {Number} the projectId for which to retrieve the help request data
 * @param viewType {String} what form the help request data should have; leave empty or use 'compact' here
 * @param restrictToUserId {String} restrict the help request  data to a particular userId; if not needed put null
 * @return {*} a Promise, resolving to the help request  data if the retrieval from the db is successful
 */
let getAllHelpRequestsForProject = function(projectId, viewType, restrictToUserId) {
    // check if restrictToUserId contains a number; we do this by formatting it from String to Number and checking for NaN
    let _userId = restrictToUserId !== null ? Number(restrictToUserId) : null;
    if(isNaN(_userId)) {
        _userId = null;
    }
    return (viewType === 'compact') ? _getAllHelpRequestsForProjectInCompactView(projectId, _userId) : _getAllHelpRequestsForProjectInFullView(projectId, _userId);
};

/**
 *
 * @param submissionId
 * @returns {Promise}
 */
let getHelpRequestById = function(helpRequestId) {

    return db.HelpRequest
        .findOne({
            attributes: [['id', 'helpRequestId'], 'ltiSessionId', 'status', 'userNote', 'teacherNote', 'createdAt', 'projectId', 'userFilesDump', 'hiddenFilesDump'],
            where: {id: helpRequestId},
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
        .then(function(helpRequest) {

            let result = {};

            if(helpRequest !== null) {
                // found a submission with the given submissionId

                result = _helperFunctions.getHelpRequestDetailObject(helpRequest);
                result.userFilesDump = JSON.parse(helpRequest.userFilesDump);
                result.hiddenFilesDump = JSON.parse(helpRequest.hiddenFilesDump);

                console.log(result.userFilesDump);
                console.log(result.hiddenFilesDump);

                result.project = {
                    projectId: helpRequest.project.id,
                    projectname: helpRequest.project.projectname,
                    language: helpRequest.project.language
                };

                // check if 'user == null', i.e. the userId for that submission was -1
                result.user = (helpRequest.user === null) ? _helperFunctions.getUserObject(helpRequest) : helpRequest.user;
            }

            return result;
        });
};


exports.getAllHelpRequestsForProject = getAllHelpRequestsForProject;
exports.getHelpRequestById = getHelpRequestById;