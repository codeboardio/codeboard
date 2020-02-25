'use strict';

/**
 * Controller for administrating an course.
 * We assume that this controller is only loaded
 * if the current user is an owner of the course.
 * Nevertheless, the server must validate the
 * users authorization again before storing any changes.
 *
 * @author Janick Michot
 */

angular.module('codeboardApp')
    .controller('CourseNewCtrl', ['$scope', '$http', '$routeParams', '$location', function ($scope, $http, $routeParams, $location) {

        // Object that holds the properties of a course and binds to the form
        $scope.data = {
            language: 'Java',
            coursename: '',
            description: ''
        };

        // Object's values are used to show success or failure message after saving data to server
        $scope.server = {
            saveSuccess: false,
            saveFailure: false
        };

        $scope.save = function(form) {

            var courseId = $routeParams.courseId;

            if(form.$valid) {

                var payload = {
                    coursename: $scope.data.coursename,
                    description: $scope.data.description
                };

                // hide user messages (in case they are displayed from a previous saving attempt)
                $scope.server.saveSuccess = false;
                $scope.server.saveFailure = false;

                $http.post('/api/courses/', payload)
                    .then(function(result) {

                        let data = result.data;

                        // show the success message
                        $scope.server.saveSuccess = true;

                        // redirect to main page
                        $location.path("/");

                    }, function(error) {
                        // show the error message and remove it after 4 seconds
                        $scope.server.saveFailure = true;
                    });
            }
        };

    }]);



angular.module('codeboardApp')
    .controller('CourseVersionsCtrl', ['$scope', '$route', 'initialData', function ($scope, $route, initialData) {

        $scope.courseData = initialData.courseData;
        $scope.userVersionSet = initialData.userVersionSet;
        $scope.userVersionType = $route.current.params.versionType;
        $scope.usernameFilter = "";

        /**
         * Because we use the same template for userProjects, helpRequests and submissions
         * we need this function to show/hide columns
         */
        $scope.isType = function(type) {
            return ($scope.userVersionType === type.toLowerCase() + 's');
        };

        /**
         * Custom Filter to search table for users
         * @param version
         * @returns {boolean|*}
         */
        $scope.categoryFilter = function(version) {
            if($scope.usernameFilter === "") {
                return version;
            } else if (version.user.username.startsWith($scope.usernameFilter)) {
                return version;
            } else if (version.user.name && version.user.name.startsWith($scope.usernameFilter)) {
                return version;
            } else if (version.project.projectname && version.project.projectname.startsWith($scope.usernameFilter)) {
                return version;
            }
            return false;
        };


    }]);

