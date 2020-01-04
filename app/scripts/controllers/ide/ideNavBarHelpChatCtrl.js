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
       *
       * @param isAnswer
       * @returns {string}
       */
      $scope.getChatLine = function (chatLine) {
          switch (chatLine.type) {
              case 'text':
                  return "chatLineText.html";
              case 'html':
                  return "chatLineHtml.html";
              case 'card':
                  return "chatLineCard.html";
          }
      };



      /**
       * init this tab
       */
      $scope.init = function() {


        // todo akuellen/alle hilferequest laden!

        // todo ok cool so können wir in der laufenden Session überprüfen ob Änderungen vorhanden sind..
        //    aber was wenn neue Session
        console.log(ProjectFactory.isProjectModified());

        console.log(ProjectFactory.getProject().updatedAt);


        // load all chat lines for this user and project
        ChatSrv.getChatHistory()
          .then(function(result) {
            result.data.forEach(function(chatLine) {
                // set alignment
                chatLine.alignment = 'left';

                if(chatLine.authorId !== chatLine.userId) {
                    chatLine.alignment = 'right';
                }
                if(chatLine.type === 'card') {
                    chatLine.message = JSON.parse(chatLine.message);
                }
                $scope.chatLines.push(chatLine);
            });
          });
      };

      $scope.init();

      $scope.chatLinePostedAt = function(date) {
          let postedAt = new Date(date);
          return postedAt.toLocaleString("de-DE");
      };

      $scope.showChatLineActions = function(chatLine) {
        return (chatLine.type === 'card' && chatLine.message.cardType === 'help');
      };


      /**
       *
       * @returns {boolean}
       */
      $scope.sendHelpRequest = function() {

        // check if note is present
        if(!$scope.note && $scope.note === "") {
          return false;
        }

        // todo check if the message is coming from the teacher or the student


        // trigger a save of the currently displayed content
        $rootScope.$broadcast(IdeMsgService.msgSaveCurrentlyDisplayedContent().msg);

        // call ProjectFactory to store the request
        ProjectFactory.requestHelp($scope.note)
          .then(function(helpRequest) {

              if(ProjectFactory.getProject().userBeingInspected) {
                  // add chatLine as html
                  ChatSrv.addChatLine(helpRequest.userNote, 'html');
              } else {
                  // when storing a card, we need to define card header and body
                  let chatLine = {
                      cardHeader: "Hilfe angefragt <a href='#'>" + helpRequest.id + "</a>",
                      cardBody: helpRequest.userNote,
                      cardType: 'help'
                  };

                  // add chatLine as card
                  ChatSrv.addChatLine(chatLine, 'card');
              }


          })
          .catch(function(error) {
              console.log(error);
          });
      };

    }]);
