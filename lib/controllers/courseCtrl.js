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
        attributes: ['coursename', 'description', 'isSubmissionAllowed']
    })
        .then(function (course) {
            if(course) {
                course.dataValues.userRole = 'owner';
                res.status(200).json(course);
            } else {
                res.send(404, {message: 'The course does not exist.'});
            }
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




let getProjectVersions = function(req, res) {

    let courseId = 1;

    // what type of version
    let _version = req.param.versionType || 'helpRequests';

    // check version types
    if(!['userProject', 'submission', 'helpRequest'].indexOf(_version)) {
        console.log("Unsupported Version Type..");
    }

    // default attributes
    let _attributes = ['id', 'createdAt', 'projectId', 'ltiSessionId'];

    //
    switch(_version) {
        case "helpRequest":
            _attributes.push('status');
        break;
    }

    // prepare _whereClause
    let _whereClause = {
        courseId: projectId
    };

    return db[_version].findAll({
        attributes : _attributes,
        where: _whereClause,
        order: ['createdAt'],
        include: [
            { model: db.User, as: 'user', attributes: [['id', 'userId'], 'username'] },
            { model: db.Project, as: 'project', attributes: [['id', 'projectId'], 'projectname'] }
        ]
    })
        .then(function(projectVersion) {

            // whatever..


        });


    // the promise to fetch the data from the db
    // todo move db request to helpRequestSrv (rename requestHelpSrv..)
    return db.HelpRequest.findAll({
        attributes : [['id', 'helpRequestId'], 'ltiSessionId', 'status', 'createdAt', 'projectId'],
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
    });




};



module.exports = {
    createCourseForUser: createCourseForUser,
    getUserCourses: getUserCourses,
    getCourse: getCourse,
    getCourseProjects: getCourseProjects
};