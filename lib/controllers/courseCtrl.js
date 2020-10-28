'use strict';

/**
 * The controller for handling requests related
 * to a courses.
 *
 * @author Janick Michot
 * @date 06.02.2020
 */

var db = require('../models'),
    logSrv = require('../services/logSrv.js'),
    helpRequestSrv = require('../services/helpRequestSrv.js'),
    submissionSrv = require('../services/submissionSrv.js');


/**
 * Creates a new course for the authenticated user.
 * Assumes: user is authenticated
 */
let createCourseForUser = function (req, res) {

    // create tmp project
    let tmpCourse = {
        coursename: req.body.coursename,
        description: req.body.description || '',
        username: req.user.username
    };

    // create new course
    return db.Course.create(tmpCourse)
        .then(function(course) {

            // create array for all promises used for defining course relations
            let courseRelations = [];

            // todo define course files here, if we need them in the future

            // add owner set
            courseRelations.push(db.User.findOne({where: {username: tmpCourse.username}}).then(function(user) {
                course.setCourseOwnerSet([user]);
            }));

            // promise all and return course id
            return Promise.all(courseRelations).then(function() {
                return course.id;
            });
        })
        .then(function(courseId) {

            if (courseId !== -1) {
                logSrv.addPageLog(logSrv.events.createProjectEvent(req, courseId ));
                res.status(201).json({message: 'Successfully created course.', id: courseId});
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
 * Get user and all his courses (courseOwnerSet and courseUserSet)
 * @param req
 * @param res
 */
let getUserCourses = function(req, res) {

    db.User.findOne({
        attributes: ['id'],
        where: {username: req.user.username},
        include: [
            { model: db.Course, as: 'courseOwnerSet', required: false },
            { model: db.Course, as: 'courseUserSet', required: false }
        ]
    })
        .then(function (usr) {
            res.status(200).json(usr);
        })
        .error(function (err) {
            res.status(500).json({message: 'Server error.'});
        });
};


/**
 * Returns a course (as owner)
 * @param req
 * @param res
 */
let getCourse = function(req, res) {

    // extract the id from the route
    var courseId = req.params.courseId;

    // if course id doesn't exist, show 404
    db.Course.findOne( {
        where: {id: courseId},
        attributes: [['id', 'courseId'], 'coursename', 'description'],
        include: [
            { model: db.CourseOption, as: 'courseOptions' }
        ]
    })
        .then(function (course) {
            if(course) {
                course.dataValues.userRole = 'owner';
                res.status(200).json(course);
            } else {
                res.send(404, {message: 'The course does not exist.'});
            }
        })
        .catch(function(err) {
           console.log(err);
        });
};


/**
 * Returns all help requests for a given courseId.
 * Assumes: a valid :courseId
 * Assumes: it's established that the request was made a legit owner of the course
 * @author Janick Michot
 */
let getCourseHelpRequests = function(req, res) {

    // get the projectId from the Url path
    var courseId = req.params.courseId;
    // there could be a query ?view=compact
    var _viewQuery = typeof req.query.view !== 'undefined' ? req.query.view : null;
    // there could be a query ?userId=someUserId
    var _userIdQuery = typeof req.query.userId !== 'undefined' ? req.query.userId : null;

    helpRequestSrv.getAllHelpRequestsForCourse(courseId, _viewQuery, _userIdQuery)
        .then(function(data) {
            res.status(200).json(data);
        })
        .catch(function(err) {
            console.log(err);
            res.status(500).json({msg: 'Error while fetching help request data.'});
        });
};

/**
 * Returns all help requests for a given courseId and a given projectId
 * Assumes: a valid :courseId and a valid :projectId
 * Assumes: it's established that the request was made a legit owner of the course and project
 * @author Janick Michot
 */
let getCourseProjectHelpRequests = function(req, res) {

    // get the courseId from the Url path
    var courseId = req.params.courseId;
    // get the projectId from the Url path
    var projectId = req.params.projectId;
    // there could be a query ?view=compact
    var _viewQuery = typeof req.query.view !== 'undefined' ? req.query.view : null;
    // there could be a query ?userId=someUserId
    var _userIdQuery = typeof req.query.userId !== 'undefined' ? req.query.userId : null;

    helpRequestSrv.getAllHelpRequestsForCourseProject(courseId, projectId, _viewQuery, _userIdQuery)
        .then(function(data) {
            res.status(200).json(data);
        })
        .catch(function(err) {
            console.log(err);
            res.status(500).json({msg: 'Error while fetching help request data.'});
        });
};

/**
 * Returns all help requests for a given courseId.
 * Assumes: a valid :courseId
 * Assumes: it's established that the request was made a legit owner of the course
 * @author Janick Michot
 */
let getCourseSubmissions = function(req, res) {

    // get the projectId from the Url path
    var courseId = req.params.courseId;
    // there could be a query ?view=compact
    var _viewQuery = typeof req.query.view !== 'undefined' ? req.query.view : null;
    // there could be a query ?userId=someUserId
    var _userIdQuery = typeof req.query.userId !== 'undefined' ? req.query.userId : null;

    submissionSrv.getAllSubmissionsForCourse(courseId, _viewQuery, _userIdQuery)
        .then(function(data) {
            res.status(200).json(data);
        })
        .catch(function(err) {
            console.log(err);
            res.status(500).json({msg: 'Error while fetching help request data.'});
        });
};

/**
 * Returns all submissions for a given courseId and a given projectId
 * Assumes: a valid :courseId and a valid :projectId
 * Assumes: it's established that the request was made a legit owner of the course and project
 * @author Janick Michot
 */
let getCourseProjectSubmissions = function(req, res) {

    // get the courseId from the Url path
    var courseId = req.params.courseId;
    // get the projectId from the Url path
    var projectId = req.params.projectId;
    // there could be a query ?view=compact
    var _viewQuery = typeof req.query.view !== 'undefined' ? req.query.view : null;
    // there could be a query ?userId=someUserId
    var _userIdQuery = typeof req.query.userId !== 'undefined' ? req.query.userId : null;

    submissionSrv.getAllSubmissionsForCourseProject(courseId, projectId, _viewQuery, _userIdQuery)
        .then(function(data) {
            res.status(200).json(data);
        })
        .catch(function(err) {
            console.log(err);
            res.status(500).json({msg: 'Error while fetching help request data.'});
        });
};

/**
 * Get all projects by a given courseId
 * @param req
 * @param res
 */
var getCourseUserProjects = function(req, res) {

    var _courseId = req.params.courseId;

    db.UserProject.findAll({
        attributes: ['id', 'updatedAt', 'isLastStoredByOwner', 'projectId'],
        where: {courseId: _courseId},
        include: [
            { model: db.User, as: 'user', attributes: [['id', 'userId'], 'username'] },
            { model: db.Project, as: 'project', attributes: [['id', 'projectId'], 'projectname'] }
        ],
        order: [['user', 'username', 'asc']]
    })
    .then(function(result) {
        res.status(200).json(result);
    });
};

/**
 * Get all projects by a given courseId
 * @param req
 * @param res
 */
var getCourseProjectUserProjects = function(req, res) {

    var _courseId = req.params.courseId,
        _projectId = req.params.projectId;

    db.UserProject.findAll({
        attributes: ['id', 'updatedAt', 'isLastStoredByOwner', 'projectId'],
        where: { courseId: _courseId, projectId: _projectId },
        include: [
            { model: db.User, as: 'user', attributes: [['id', 'userId'], 'username'] },
            { model: db.Project, as: 'project', attributes: [['id', 'projectId'], 'projectname'] }
        ],
        order: [['updatedAt', 'asc']]
    })
        .then(function(result) {
            res.status(200).json(result);
        })
        .catch(function(err) {
            res.sendStatus(404);
        });
};


module.exports = {
    createCourseForUser: createCourseForUser,
    getUserCourses: getUserCourses,
    getCourse: getCourse,
    getCourseHelpRequests: getCourseHelpRequests,
    getCourseSubmissions: getCourseSubmissions,
    getCourseUserProjects: getCourseUserProjects,
    getCourseProjectHelpRequests: getCourseProjectHelpRequests,
    getCourseProjectSubmissions: getCourseProjectSubmissions,
    getCourseProjectUserProjects: getCourseProjectUserProjects
};
