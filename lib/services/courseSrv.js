/**
 * Created by mict on 10/28/20.
 *
 * This service module provides a number of utility functions for courses. Many of
 * them are perform database operations.
 */

'use strict';


const { Course, User, Project } = require('../models');

/**
 * Returns a promise that resolves to an array that contains
 * the usernames of the courseOwnerSet of the course.
 * @param courseId
 * @returns {Promise<[]>}
 */
let getCourseOwners = function (courseId) {
    return Course.findByPk(courseId, {
        include: [
            { model: User, as: 'courseOwnerSet', attributes: ['id', 'username']}
        ]
    })
        .then(course => {
            return (course) ? course.courseOwnerSet : [];
        });
};

/**
 * Returns a promise that resolves to true if given user is owner of given course.
 * @param courseId
 * @param username
 * @returns {Promise<boolean>}
 */
let isCourseOwner = function(courseId, username) {
    return getCourseOwners(courseId)
        .then(courseOwnerSet => {
            return courseOwnerSet.some(owner => owner.username === username);
        });
};

/**
 * Returns a promise that resolves to true if given project belongs to a course
 * @param courseId
 * @param projectId
 * @returns {*}
 */
let isProjectInCourse = function (courseId, projectId) {
    return Course.count({
        where: {
            id: courseId
        },
        include: [
            { model: Project, as: 'projectSet', where: {id: projectId} }
        ]
    })
        .then(numCourse => (numCourse === 1));
};


exports.isCourseOwner = isCourseOwner;
exports.isProjectInCourse = isProjectInCourse;
