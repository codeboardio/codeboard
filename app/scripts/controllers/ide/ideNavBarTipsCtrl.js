/**
 * @author Janick Michot
 * @date 19.12.2019
 */

'use strict';

angular.module('codeboardApp')

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
