/**
 * @author Janick Michot
 * @date 19.12.2019
 */

'use strict';

angular.module('codeboardApp')

    /**
     * Controller for Project Description
     */
    .controller('ideNavBarDescriptionCtrl', ['$scope', '$rootScope', '$sce', '$timeout', 'IdeMsgService', 'ProjectFactory',
    function ($scope, $rootScope, $sce, $timeout, IdeMsgService, ProjectFactory) {

      let slug = 'description';

      // scope defaults
      $scope.content = "Keine Aufgabenbeschreibung für dieses Projekt. Sollten wir Button ausblenden, wenn keine Aufgabenbeschreibung definiert?";

      /**
       * init this tab
       */
      $scope.init = function() {

        // get project description file
        let file = ProjectFactory.getFile('projectDescription.html');

        // check if a description is available, otherwise use broadcast to make tab disabled
        if(!file) {
          let req = IdeMsgService.msgNavBarRightDisableTab(slug);
          $rootScope.$broadcast(req.msg, req.data);
        } else {
          $scope.content = file.content;
        }

        // make description default tab
        $timeout(function() {
          let req = IdeMsgService.msgNavBarRightOpenTab('description');
          $rootScope.$broadcast(req.msg, req.data);
        }, 500);
      };

      $scope.init();

    }]);
