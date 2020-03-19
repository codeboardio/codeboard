/**
 * @author Janick Michot
 * @date 19.12.2019
 */

'use strict';

angular.module('codeboardApp')

    /**
     * Controller for Project Description
     */
    .controller('ideNavBarRightSampleSolutionCtrl', ['$scope', '$rootScope', '$sce', '$timeout', 'IdeMsgService', 'ProjectFactory',
    function ($scope, $rootScope, $sce, $timeout, IdeMsgService, ProjectFactory) {

      let slug = 'sampleSolution';

      // scope defaults
      $scope.sampleSolution = "";

      /**
       * init this tab
       */
      $scope.init = function() {
        // check if a sampleSolution is available and the user has already a correct submission,
        // otherwise we use broadcast to make tab disabled
        if(ProjectFactory.getProject().projectCompleted || ProjectFactory.getProject().userRole !== 'user') {
          $scope.sampleSolution = ProjectFactory.getSampleSolution();
        } else {
          let req = IdeMsgService.msgNavBarRightDisableTab(slug);
          $rootScope.$broadcast(req.msg, req.data);
        }
      };

      $scope.init();


      /**
       * Listen on successful submission in order to show the sample solution
       * after successful submission
       */
      $scope.$on(IdeMsgService.msgSuccessfulSubmission().msg, function () {
        $scope.sampleSolution = ProjectFactory.getSampleSolution();
        let req = IdeMsgService.msgNavBarRightEnableTab("sampleSolution");
        $rootScope.$broadcast(req.msg, req.data);
      });

    }]);
