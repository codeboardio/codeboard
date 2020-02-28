/**
 * Resources for functionality that is linked to courses.
 *
 * @author Janick Michot
 */

'use strict';


angular.module('codeboardApp')

    .factory('CourseRes', ['$resource', function($resource) {
        return $resource(
            '/api/courses/:courseId/',
            {courseId: '@id'}
        );
    }])

    .factory('CourseHelpRequestRes', ['$resource', function($resource) {
        return $resource(
            '/api/courses/:courseId/helpRequests',
            {courseId: '@id'},
            {update: {method: 'PUT', isArray: false}}
        );
    }])

    .factory('CourseSubmissionRes', ['$resource', function($resource) {
        return $resource(
            '/api/courses/:courseId/submissions',
            {courseId: '@id'}
        );
    }])

    .factory('CourseVersionRes', ['$resource', function($resource) {
        return $resource(
            '/api/courses/:courseId/:versionType',
            {courseId: '@id', versionType: '@versionType'}
        );
    }]);