'use strict';

/**
 * The controller for handling requests related
 * to a courses.
 *
 * @author Janick Michot
 * @date 06.02.2020
 */

var db = require('../models'),
    logSrv = require('../services/logSrv.js');


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
        attributes: [['id', 'courseId'], 'coursename', 'description']
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
 * Returns all projects related to a course
 * @param req
 * @param res
 */
let getCourseProjects = function(req, res) {
    // todo set up relationship between course and projects..
};


/**
 * This functions returns user versions (helpRequests, userProjects, Submissions) of a course
 * @param req
 * @param res
 * @returns {*}
 */
let getProjectVersions = function(req, res) {

    // get course id
    let courseId = req.params.courseId;

    // what type of version
    let _version = req.params.versionType || 'helpRequest';

    // check version types
    if(['userProject', 'submission', 'helpRequest'].indexOf(_version) === -1) {
        return res.status(404).json({msg: 'Unsupported VersionType'});
    }

    // default attributes
    let _attributes = ['id', 'createdAt', 'projectId'];

    // change attributes depending on version
    switch(_version) {
        case "helpRequest":
            _attributes.push('status', 'ltiSessionId');
            break;
        case "submission":
            _attributes.push('ltiSessionId', 'testResult', 'numTestsPassed', 'numTestsFailed');
            break;
    }

    // make first letter uppercase to get the right db model
    _version = _version.substring(0, 1).toUpperCase() + _version.substring(1);

    // flexible query for HelpRequests, Submissions and UserProjects
    return db[_version].findAll({
        attributes : _attributes,
        order: ['createdAt'],
        // raw: true,
        include: [
            { model: db.User, as: 'user', attributes: [['id', 'userId'], 'username', 'name']  },
            { model: db.Project, as: 'project', attributes: [['id', 'projectId'], 'projectname'], required : true,
                include: { model: db.Course, as: 'courseSet', where: {id: courseId}, attributes: [['id', 'courseId']], required : true }
            }
        ]
    })
        .then(function(data) {
            res.status(200).json(data); // turns sequelize object into json
        })
        .catch(function(err) {
            console.log(err);
            res.status(500).json({msg: 'Error while fetching ' + _version + ' data.'});
        });
};

/**
 * Get course submissions
 * @param req
 * @param res
 * @returns {*}
 */
let getCourseSubmissions = function(req, res) {
    req.params.versionType = 'submission';
    return getProjectVersions(req, res);
};

/**
 * Get course user projects
 * @param req
 * @param res
 * @returns {*}
 */
let getCourseUserProjects = function(req, res) {
    req.params.versionType = 'userProject';
    return getProjectVersions(req, res);
};

/**
 * Get Course Help Requests
 * @param req
 * @param res
 * @returns {*}
 */
let getCourseHelpRequests= function(req, res) {
    req.params.versionType = 'helpRequest';
    return getProjectVersions(req, res);
};


module.exports = {
    createCourseForUser: createCourseForUser,
    getUserCourses: getUserCourses,
    getCourse: getCourse,
    getCourseProjects: getCourseProjects,
    getProjectVersions: getProjectVersions,
    getCourseSubmissions: getCourseSubmissions,
    getCourseUserProjects: getCourseUserProjects,
    getCourseHelpRequests: getCourseHelpRequests
};