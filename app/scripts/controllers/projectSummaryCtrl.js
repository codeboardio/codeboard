'use strict';

/**
 * Created by haches on 14.11.2014.
 *
 * Controller for the summary page of a project.
 *
 */

angular.module('codeboardApp')
  .controller('ProjectSummaryCtrl', ['$scope', '$http', '$log', '$routeParams', '$location', 'projectSummaryData', 'UserSrv',
    function($scope, $http, $log, $routeParams, $location, projectSummaryData, UserSrv) {

      $scope.prj = projectSummaryData;

      /**
       * Checks if the current user is an owner of the project for which the summary is displayed.
       * @return true if the current user is a) authenticated and b) an owner of the project
       */
      $scope.isCurrentUserProjectOwner = function() {
        return UserSrv.isAuthenticated() && projectSummaryData.ownerSet.some(
            function(element, index, array) {
              return element.username === UserSrv.getUsername();
            }
          );
      };

    }]);
