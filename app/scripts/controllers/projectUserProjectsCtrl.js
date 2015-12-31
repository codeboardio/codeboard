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
  .controller('ProjectUserProjectsCtrl', ['$scope', '$log', '$routeParams', '$http',
    function ($scope, $log, $routeParams, $http) {


      $scope.usernameFilter = undefined;
      $scope.projectId = $routeParams.projectId;

      $scope.userProjects = [];



      /**
       * Function is run when the controller loads to fetch the stats for compilation and runs of the project.
       */
      var init = function() {

        var _projectId = $routeParams.projectId;

        $http.get('/api/projects/' + _projectId + '/userprojects')
          .success(function(data, status, headers, config) {

            $scope.userProjects = data;
          })
          .error(function(data, status, headers, config) {

            $log.debug('Can not get the userprojects');

          });
      }();


      /**
       * Function to return the sum of all values stored in an array under "propertyname".
       * @param inputArray the array over which to iterate
       * @param propertyName the name of the property of each array element that should be summed
       * @return {number} the total sum
       */
      var getTotal = function(inputArray, propertyName) {
        var result = 0;

        for(var i = 0; i < inputArray.length; i++) {
          result += inputArray[i][propertyName];
        }

        return result;
      }

}]);
