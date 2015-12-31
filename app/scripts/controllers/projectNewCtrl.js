'use strict';

/**
 * Created by haches on 18.07.2014.
 *
 * Controller for administrating an object.
 * We assume that this controller is only loaded
 * if the current user is an owner of the project.
 * Nevertheless, the server must validate the
 * users authorization again before storing any changes.
 */

angular.module('codeboardApp')
  .controller('ProjectNewCtrl', ['$scope', '$http', '$routeParams', '$location', '$route', '$timeout',
    function ($scope, $http, $routeParams, $location, $route, $timeout) {

    // Object that holds the properties of a project and binds to the form
    $scope.data = {
      language: 'Java-JUnit'
    };

    // Object's values are used to show success or failure message after saving data to server
    $scope.server = {
      saveSuccess: false,
      saveFailure: false
    }


    $scope.save = function(form) {

      var projectId = $routeParams.projectId;

      if(form.$valid) {

        var payload = {
          projectname: $scope.data.projectname,
          description: $scope.data.description,
          language: $scope.data.language,
          isPrivate: $scope.data.isPrivate
        }

        // hide user messages (in case they are displayed from a previous saving attempt)
        $scope.server.saveSuccess = false;
        $scope.server.saveFailure = false;

        $http
          .post('/api/projects/', payload)
          .success(function(data, status, headers, config) {

            // show the success message
            $scope.server.saveSuccess = true;

            // redirect to the summary page of the project
            $location.path( "/projects/" + data.id + '/summary');
          })
          .error(function(data, status, headers, config) {
            // show the error message and remove it after 4 seconds
            $scope.server.saveFailure = true;
          });
      }
    }

}]);
