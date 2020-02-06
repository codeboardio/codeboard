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
  .controller('ProjectHelpRequestsCtrl', ['$scope', '$log', '$routeParams', '$http',
    function ($scope, $log, $routeParams, $http) {


      $scope.usernameFilter = undefined;
      $scope.projectId = $routeParams.projectId;

      $scope.submissionData = [];



      /**
       * Function is run when the controller loads to fetch the stats for compilation and runs of the project.
       */
      let init = function() {

        let _projectId = $routeParams.projectId;

        $http.get('/api/projects/' + _projectId + '/helpRequests')
          .then(function(result) {
            $scope.helpRequestData = result.data;
          }, function(error) {
            $log.debug('Can not get the submissions');
          });
      };

      init();

}]);
