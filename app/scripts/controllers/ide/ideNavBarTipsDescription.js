/**
 * @author Janick Michot
 * @date 19.12.2019
 */

'use strict';

angular.module('codeboardApp')

    /**
     * Controller for Project Description
     */
    .controller('ideNavBarDescriptionCtrl', ['$scope', '$rootScope', '$sce', 'IdeMsgService', 'ProjectFactory',
    function ($scope, $rootScope, $sce, IdeMsgService, ProjectFactory) {

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
      };

      $scope.init();

    }])


    /**
     * Controller for Tips
     */
    .controller('ideNavBarTipsCtrl', ['$scope', '$rootScope', 'IdeMsgService', 'ProjectFactory',
        function ($scope, $rootScope, IdeMsgService, ProjectFactory) {

            let slug = 'tips';

            $scope.tips = [];

            /**
             * init this tab
             */
            $scope.init = function() {
              // read tips from config file
              let config = ProjectFactory.getConfig();

                // check if a tips are available, otherwise use broadcast to make tab disabled
                if("Help" in config && "tips" in config.Help) {
                 $scope.tips = config.Help.tips;
                 $scope.helpIntro = config.Help.helpIntro;
              } else {
                  let req = IdeMsgService.msgNavBarRightDisableTab(slug);
                  $rootScope.$broadcast(req.msg, req.data);
              }
            };

            $scope.init();

        }]);
