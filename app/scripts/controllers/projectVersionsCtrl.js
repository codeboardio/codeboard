'use strict';

/**
 *
 * @author Janick Michot
 */


angular.module('codeboardApp')
    .controller('CourseVersionsCtrl', ['$scope', '$route', 'initialData', 'ProjectFactory', function ($scope, $route, initialData, ProjectFactory) {

        $scope.courseData = initialData.courseData;
        $scope.userVersionSet = initialData.userVersionSet;
        $scope.userVersionType = $route.current.params.versionType;
        $scope.usernameFilter = "";

        // define title depending userVersionType
        switch($scope.userVersionType) {
            case "helprequests":
                $scope.title = "Hilfe-Anfragen für Kurs: <a href='/course/" + $scope.courseData.courseId + "/summary'>" + $scope.courseData.coursename  + "</a>";
                break;
            case "submissions":
                $scope.title = "Submissions für Kurs: <a href='/course/" + $scope.courseData.courseId + "/summary'>" + $scope.courseData.coursename  + "</a>";
                break;
            case "userprojects":
                $scope.title = "User-Versionen zu Kurs: <a href='/course/" + $scope.courseData.courseId + "/summary'>" + $scope.courseData.coursename  + "</a>";
                break;
        }

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

        /**
         * Method to update help request
         * @param helpRequestId
         * @returns {a}
         */
        $scope.updateHelpRequestStatus = function(helpRequest) {
            return ProjectFactory.updateHelpRequest(helpRequest.id).then(() => helpRequest.status = "answered");
        };
    }]);


angular.module('codeboardApp')
    .controller('ProjectVersionsCtrl', ['$scope', '$route', 'initialData', 'ProjectFactory', function ($scope, $route, initialData, ProjectFactory) {

        $scope.projectData = initialData.projectData;
        $scope.userVersionSet = initialData.userVersionSet;
        $scope.userVersionType = $route.current.params.versionType;
        $scope.usernameFilter = "";

        // define title depending userVersionType
        switch($scope.userVersionType) {
            case "helprequests":
                $scope.title = "Hilfe-Anfragen für Projekt: <a href='/projects/" + $scope.projectData.id + "/summary'>" + $scope.projectData.projectname  + "</a>";
                break;
            case "submissions":
                $scope.title = "Submissions für Projekt: <a href='/projects/" + $scope.projectData.id + "/summary'>" + $scope.projectData.projectname  + "</a>";
                break;
            case "userprojects":
                $scope.title = "User-Versionen zu Projekt: <a href='/projects/" + $scope.projectData.id + "/summary'>" + $scope.projectData.projectname  + "</a>";
                break;
        }

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

        /**
         * Method to update help request
         * @param helpRequestId
         * @returns {a}
         */
        $scope.updateHelpRequestStatus = function(helpRequest) {
            return ProjectFactory.updateHelpRequest(helpRequest.id).then(() => helpRequest.status = "answered");
        };
    }]);

angular.module('codeboardApp')
    .controller('CourseProjectVersionsCtrl', ['$scope', '$route', 'initialData', 'ProjectFactory', function ($scope, $route, initialData, ProjectFactory) {

        $scope.projectData = initialData.projectData;
        $scope.courseData = initialData.courseData;
        $scope.userVersionSet = initialData.userVersionSet;
        $scope.userVersionType = $route.current.params.versionType;
        $scope.usernameFilter = "";

        // define title depending userVersionType
        switch($scope.userVersionType) {
            case "helprequests":
                $scope.title = "Hilfe-Anfragen für Projekt: <a href='/projects/" + $scope.projectData.id + "/summary'>" + $scope.projectData.projectname  + "</a> aus dem Kurs: <a href='/course/" + $scope.courseData.courseId + "/summary'>" + $scope.courseData.coursename  + "</a>";
                break;
            case "submissions":
                $scope.title = "Submissions für Projekt: <a href='/projects/" + $scope.projectData.id + "/summary'>" + $scope.projectData.projectname  + "</a> aus dem Kurs: <a href='/course/" + $scope.courseData.courseId + "/summary'>" + $scope.courseData.coursename  + "</a>";
                break;
            case "userprojects":
                $scope.title = "User-Versionen des Projekts: <a href='/projects/" + $scope.projectData.id + "/summary'>" + $scope.projectData.projectname  + "</a> aus dem Kurs: <a href='/course/" + $scope.courseData.courseId + "/summary'>" + $scope.courseData.coursename  + "</a>";
                break;
        }

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

        /**
         * Method to update help request
         * @param helpRequestId
         * @returns {a}
         */
        $scope.updateHelpRequestStatus = function(helpRequest) {
            return ProjectFactory.updateHelpRequest(helpRequest.id).then(() => helpRequest.status = "answered");
        };
    }]);


