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
    }])


    .factory('initialDataForCourseUserVersionsAll', ['$resource', '$q', 'CourseRes', 'CourseVersionRes',
        function($resource, $q, CourseRes, CourseVersionRes) {

        return function(courseId, versionType) {

            // create the promise that is returned
            let deferred = $q.defer();

            // get course data
            let courseData = CourseRes.get({courseId: courseId}).$promise;

            // get help requests
            let helpRequests = CourseVersionRes.query({courseId: courseId, versionType: versionType}).$promise;

            // promise all
            $q.all([courseData, helpRequests])
                .then(function(results) {
                    deferred.resolve({
                        courseData: results[0],
                        helpRequestSet: results[1]
                    });
                }, function(err) {
                    deferred.reject("Course or course data not found");
                });

            return deferred.promise;
        };
    }]);
