/**
 * Resources for functionality that is linked to user versions
 *
 * @author Janick Michot
 */

'use strict';


angular.module('codeboardApp')

    .factory('ideInitialDataForUserVersion', ['$resource', '$q', '$http', '$route', function($resource, $q, $http, $route) {

        return function(projectId, userVersionId, userVersionType) {

            let deferred = $q.defer();

            $http.get('/api/projects/' + projectId + '/' + userVersionType + '/' + userVersionId)
                .then(function (response) {

                    // we got the data from the sever but it's not in the exact form that the IdeCtrl expects
                    // thus we reformat it here; we also have to calculate the lastUId (though the user is not likely to add files)

                    let projectData = {
                        projectname: response.data.project.projectname,
                        language: response.data.project.language,
                        userRole: $route.current.params.versionType,
                        username: response.data.user.username, // the user that's being inspected
                        updatedAt: response.data.updatedAt
                    };

                    // construct the fileSet
                    if(response.data.hiddenFilesDump !== null) {
                        projectData.fileSet = response.data.userFilesDump.concat(response.data.hiddenFilesDump);

                        // the config file is also part of the hidden files dump.
                        projectData.configFile = response.data.hiddenFilesDump.find(function(file) {
                            return file.filename === "codeboard.json";
                        });

                    } else {
                        projectData.fileSet = response.data.userFilesDump;
                    }

                    // calculate the lastUId by iterating over all files in fileSet
                    let _lastUId = 0;
                    projectData.fileSet.every(function (elem) {
                        if (elem.uniqueId > _lastUId) {
                            _lastUId = elem.uniqueId;
                        }
                    });
                    projectData.lastUId = _lastUId;

                    // we always disable the option to "submit" when looking at a submission
                    projectData.isSubmissionAllowed = false;

                    deferred.resolve(projectData);
                });

            return deferred.promise;
        };
    }])

    .factory('initialDataForCourseUserVersionsAll', ['$resource', '$q', 'CourseRes', 'CourseVersionRes',
        function($resource, $q, CourseRes, CourseVersionRes) {

            return function(courseId, versionType) {

                // create the promise that is returned
                let deferred = $q.defer();

                // get course data
                let courseData = CourseRes.get({courseId: courseId}).$promise;

                // get help requests
                let userVersions = CourseVersionRes.query({courseId: courseId, versionType: versionType}).$promise;

                // promise all
                $q.all([courseData, userVersions])
                    .then(function(results) {
                        deferred.resolve({
                            courseData: results[0],
                            userVersionSet: results[1]
                        });
                    }, function(err) {
                        deferred.reject("Course or course data not found");
                    });

                return deferred.promise;
            };
        }])


    .factory('initialDataForProjectUserVersionsAll', ['$resource', '$http', '$q', 'ProjectRes',
        function($resource, $http, $q, ProjectRes) {

            return function(projectId, versionType) {

                // create the promise that is returned
                let deferred = $q.defer();

                // get course data
                let projectData = ProjectRes.get({projectId: projectId}).$promise;

                // get help requests
                let userVersions = $http.get('/api/projects/' + projectId + '/' + versionType)
                    .then(function(result) {
                        return result.data;
                    });

                // promise all
                $q.all([projectData, userVersions])
                    .then(function(results) {
                        deferred.resolve({
                            projectData: results[0],
                            userVersionSet: results[1]
                        });
                    }, function(err) {
                        deferred.reject("Course or course data not found");
                    });

                return deferred.promise;
            };
        }])

    .factory('initialDataForCourseProjectUserVersionsAll', ['$resource', '$http', '$q', 'ProjectRes', 'CourseRes', 'CourseVersionRes',
        function($resource, $http, $q, ProjectRes, CourseRes, CourseVersionRes) {

            return function(courseId, projectId, versionType) {

                // create the promise that is returned
                let deferred = $q.defer();

                // get course data
                let projectData = ProjectRes.get({projectId: projectId}).$promise;

                // get course data
                let courseData = CourseRes.get({courseId: courseId}).$promise;

                // get help requests
                let userVersions = $http.get('/api/courses/' + courseId + '/projects/' + projectId + '/' + versionType)
                    .then(function(result) {
                        return result.data;
                    });

                // promise all
                $q.all([projectData, courseData, userVersions])
                    .then(function(results) {
                        deferred.resolve({
                            projectData: results[0],
                            courseData: results[1],
                            userVersionSet: results[2]
                        });
                    }, function(err) {
                        deferred.reject("Course or course data not found");
                    });

                return deferred.promise;
            };
        }]);