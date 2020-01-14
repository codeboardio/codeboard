/**
 * This is the controller for the navBarTab "Help".
 * It makes use of the `chatSrv` in order to request tips and help, as well as enabling the chat function.
 *
 * @author Janick Michot
 * @date 19.12.2019
 */

'use strict';

angular.module('codeboardApp')

    /**
     * Controller for Project Description
     */
    .controller('ideNavBarHelpCtrl', ['$scope', '$rootScope', '$sce', 'IdeMsgService', 'ProjectFactory', 'ChatSrv',
    function ($scope, $rootScope, $sce, IdeMsgService, ProjectFactory, ChatSrv) {

        let slug = 'help',
            defaultMessage  = "Nutze diesen Tab, wenn du Schwierigkeiten hast, diese Aufgabe zu lösen. Lass dir zunächst Tipps anzeigen. Falls du noch immer Mühe hast, nutze die Chat-Funktion, um Hilfe anzufordern.",
            avatarName = "Roby"; // todo dieser Benutzername ist eingetlich nicht statisch ...

        // scope defaults
        $scope.content = "Hilfe-Funktion ist für diese Aufgabe deaktiviert!";
        $scope.chatLines = [];
        $scope.tips = [];
        $scope.numTips = 0;
        $scope.sendRequestFormVisible = false;


        /**
         * Returns the number of already sent tips
         * @returns {*}
         */
        let getNumTipsAlreadySent = function () {
            let chatLineTips = $scope.chatLines.filter(function(chatLine) {
                return (chatLine.type === 'card' && chatLine.message.cardType === "tip");
            });
            return chatLineTips.length;
        };

        /**
         *
         * @param chatLine
         * @returns {*}
         */
        let addChatLine = function(chatLine) {
            chatLine.alignment = 'right';
            if(chatLine.authorId !== chatLine.userId) {
                chatLine.alignment = 'left';
            }

            // if chatLine type card, parse the message
            if(chatLine.type === 'card') {
                chatLine.message = JSON.parse(chatLine.message);
            }
            $scope.chatLines.push(chatLine);
        };

        /**
         * init this tab by loading chat history and read tips
         */
        $scope.init = function() {

            $scope.sendRequestFormVisible = !$scope.currentRoleIsUser();

            // load chat history
            ChatSrv.getChatHistory()
                .then(function(result) {

                    // default message
                    addChatLine({
                        id: -1,
                        authorId: -1,
                        type: "text",
                        message: defaultMessage,
                        author: {username: avatarName}
                    });

                    // loop trough chatlines
                    result.data.forEach(function(chatLine) {
                        addChatLine(chatLine);
                    });
                })
                .then(function() {
                    // read all tips for this project
                    let config = ProjectFactory.getConfig();
                    if("Help" in config && "tips" in config.Help) {
                        $scope.tips = config.Help.tips;
                        $scope.numTips = $scope.tips.length;
                        $scope.helpIntro = config.Help.helpIntro;
                    }
                })
                .catch(function() {
                    console.log("Fehler beim Laden des Chatverlaufs");
                });
        };
        $scope.init();


        /**
         * Returns formatted posted at
         * @param date
         * @returns {string}
         */
        $scope.chatLinePostedAt = function(date) {
            let postedAt = new Date(date);
            if(postedAt instanceof Date && !isNaN(postedAt)) {
                return postedAt.toLocaleString("de-DE");
            }
            return "todo";
        };

        /**
         * This functions adds a chatline with a tip.
         */
        $scope.sendTipRequest = function() {

            let i = getNumTipsAlreadySent(),
                tip = $scope.tips[i];

            if(typeof tip !== "undefined") {
                // when storing a card, we need to define card header and body
                let chatLine = {
                    cardHeader: tip.name,
                    cardBody: tip.note,
                    cardType: 'tip'
                };

                // add chatline and reload chat history
                ChatSrv.addChatLine(chatLine, 'card', 'avatar')
                    .then(function(chatLine) {
                        addChatLine(chatLine);
                    });
            }
        };

        /**
         * Creates a new `helprequest` version of the current project.
         * Afterwards a chatline is added which references this version.
         */
        $scope.sendHelpRequest = function() {

            // check if note is present
            if(!$scope.note && $scope.note === "") {
                return false;
            }

            // trigger a save of the currently displayed content
            $rootScope.$broadcast(IdeMsgService.msgSaveCurrentlyDisplayedContent().msg);

            // call ProjectFactory to store the request
            ProjectFactory.requestHelp($scope.note)
                .then(function(helpRequest) {

                    if(ProjectFactory.getProject().userBeingInspected) {
                        // add chatLine as html and reload chat history
                        ChatSrv.addChatLine(helpRequest.userNote, 'html')
                            .then(function(chatLine) {
                                addChatLine(chatLine);
                            });
                    } else {
                        // when storing a card, we need to define card header and body
                        let chatLine = {
                            cardHeader: "Hilfe angefragt <a href='#'>" + helpRequest.id + "</a>",
                            cardBody: helpRequest.userNote,
                            cardType: 'help'
                        };

                        // add chatline and reload chat history
                        ChatSrv.addChatLine(chatLine, 'card')
                            .then(function(chatLine) {
                                addChatLine(chatLine);
                            });
                    }

                })
                .catch(function(error) {
                    console.log(error);
                });
        };

        /**
         * Returns the template for a chat line
         * @param chatLine
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
         * get the user icon depending on the author and message type
         * @param chatLine
         * @returns {string}
         */
        $scope.getUserAvatar = function(chatLine) {
            if(chatLine.author.username === avatarName) {
                return "../../../images/avatars/Avatar_RobyCoder_RZ_idea.svg";
            }
            return "../../../images/avatars/Avatar_RobyCoder_RZ_neutral.svg";
        };


        /**
         * Show send request form on click
         */
        $scope.showSendRequestForm = function() {
            $scope.sendRequestFormVisible = true;
        };

    }]);
