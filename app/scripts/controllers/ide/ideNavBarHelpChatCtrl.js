/**
 * @author Janick Michot
 * @date 19.12.2019
 */

'use strict';

angular.module('codeboardApp')

    /**
     * Controller for Project Description
     */
    .controller('ideNavBarHelpChatCtrl', ['$scope', '$rootScope', '$sce', 'IdeMsgService', 'ProjectFactory', 'ChatSrv',
    function ($scope, $rootScope, $sce, IdeMsgService, ProjectFactory, ChatSrv) {

      let slug = 'help';

      // scope defaults
      $scope.content = "Hilfe-Funktion ist für diese Aufgabe deaktiviert!";

      $scope.chatLines = [];

      /**
       * Listen to help request event and add chat line on new help requests
       */
      $scope.$on(IdeMsgService.msgHelpRequest().msg, function () {
        ChatSrv.addChatLine("Neue Chat Linie");
      });


      /**
       *
       * @param isAnswer
       * @returns {string}
       */
      $scope.getChatLine = function (isAnswer) {

          console.log(isAnswer);
        if(isAnswer) {
          return "chatLineAnswer.html";
        } else {
          return "chatLineQuestion.html";
        }
      };



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

        // load all chat lines for this user and project
        ChatSrv.getChatHistory()
          .then(function(res) {
            console.log(res);
            $scope.chatLines = res.data;
          });
      };

      $scope.init();

    }]);
