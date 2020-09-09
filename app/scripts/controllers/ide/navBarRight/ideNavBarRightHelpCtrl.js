/**
 * This is the controller for the navBarTab "Help".
 * It makes use of the 'chatSrv' in order to request tips and help, as well as enabling the chat function.
 *
 * @author Janick Michot
 * @date 19.12.2019
 */

'use strict';

angular.module('codeboardApp')

    /**
     * Controller for Project Description
     */
    .controller('ideNavBarRightHelpCtrl', ['$scope', '$rootScope', '$sce', '$routeParams', '$http', '$timeout', 'IdeMsgService', 'ProjectFactory', 'ChatSrv', 'UserSrv',
    function ($scope, $rootScope, $sce, $routeParams, $http, $timeout, IdeMsgService, ProjectFactory, ChatSrv, UserSrv) {

        let slug = 'help',
            avatarName = "Roby"; // todo dieser Benutzername ist eingetlich nicht statisch ...

        // scope variables
        $scope.chatLines = [];
        $scope.tips = [];
        $scope.sendRequestFormVisible = false;
        $scope.requestTipDisabled = true;


        /**
         * Function to scroll to the bottom of the chat tab
         * todo probably not the best solution and not the angular way
         */
        let chatScrollToBottom = function() {
            $timeout(function(){
                document.getElementById("targetinto").scrollIntoView();
            }, 10);
        };

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
         * This functions adds a chat line into the view
         * With the parameter 'scrollToBottom' whether or not the conversation box should be
         * scrolled to the bottom or not
         *
         * @param chatLine
         * @param scrollToBottom
         */
        let addChatLine = function(chatLine, scrollToBottom = false) {

            // define chatline alignment depending on current visitor
            chatLine.alignment = (chatLine.authorId !== chatLine.userId) ? 'left' : 'right';

            // if chatLine type card, parse the message
            if(chatLine.type === 'card') chatLine.message = JSON.parse(chatLine.message);

            // add card to the list
            $scope.chatLines.push(chatLine);

            if(scrollToBottom) {
                chatScrollToBottom();
            }

            // re-empty note field
            $scope.note = "";
        };


        /**
         * First create a new 'helpRequest' and then add a new chatline with reference
         * to the helpRequest.
         *
         * @param aMessage
         * @returns {*}
         */
        let sendHelpRequest = function(aMessage) {

            // trigger a save of the currently displayed content
            $rootScope.$broadcast(IdeMsgService.msgSaveCurrentlyDisplayedContent().msg);

            // call ProjectFactory to store the request
            return ProjectFactory.createHelpRequest()
                .then(function(helpRequest) {
                    let reference = "/projects/" + helpRequest.projectId + "/helprequests/" + helpRequest.id;
                    return ChatSrv.addChatLineCard(aMessage,"Hilfe angefragt", 'help', reference, helpRequest.id);
                })
                .then(function(chatLine) {
                    addChatLine(chatLine, true);
                    $scope.sendRequestFormVisible = false;
                });
        };

        /**
         * First check for open helpRequests and get id of latest request.
         * Then add new chatline with reference to this request.
         *
         * @param aMessage
         * @returns {*}
         */
        let teacherAnswerHelpRequest = function(aMessage) {

            // filter all chatlines with status unanswered
            let chatLinesUnanswered = $scope.chatLines.filter(function(chatLine) {
               return (chatLine.subject && chatLine.subject.status === 'unanswered');
            });

            // change status (update) of all unanswered helpRequests
            return chatLinesUnanswered.reduce(function(previousHelpRequest, chatLine) {
                return ProjectFactory.updateHelpRequest(chatLine.subjectId);
            }, Promise.resolve())
                .then(function(helpRequest) {
                    let id = (helpRequest !== undefined) ? helpRequest.id : -1;
                    return ChatSrv.addChatLine(aMessage, id, UserSrv.getUsername(), 'html');
                })
                .then(function(chatLine) {
                    addChatLine(chatLine, true);
                });
        };

        /**
         * init this tab by loading chat history and read tips
         */
        $scope.init = function() {

            $scope.sendRequestFormVisible = !$scope.currentRoleIsUser();

            // when user role help, make help default tab
            if(ProjectFactory.getProject().userRole === 'help') {
                $timeout(function () {
                    let req = IdeMsgService.msgNavBarRightOpenTab('help');
                    $rootScope.$broadcast(req.msg, req.data);
                }, 500);
            }


            // load chat history
            ChatSrv.getChatHistory()
                .then(function(result) {
                    result.data.forEach(function(chatLine) {
                        addChatLine(chatLine);
                    });
                })
                .then(function() {
                    // read all tips from codeboard.json
                    let config = ProjectFactory.getConfig();
                    if(config && "Help" in config && "tips" in config.Help) {
                        $scope.tips = config.Help.tips;
                        $scope.helpIntro = config.Help.helpIntro;
                        $scope.requestTipDisabled = (getNumTipsAlreadySent() >= $scope.tips.length);
                    }
                })
                .catch(function() {
                    console.log("Fehler beim Laden des Chatverlaufs");
                });
        };
        $scope.init();

        /**
         * On open help tab, scroll to the bottom
         */
        $scope.$on(IdeMsgService.msgNavBarRightOpenTab().msg, function (event, data) {
            if(data.tab === slug) {
                chatScrollToBottom();
            }
        });

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
            return "";
        };

        /**
         * This functions adds a chatline with a tip.
         */
        $scope.askForTip = function() {
            let tip = $scope.tips[getNumTipsAlreadySent()];
            if(typeof tip !== "undefined") {
                ChatSrv.addChatLineCard(tip.note, tip.name, 'tip', null, null, avatarName)
                    .then(function(chatLine) {
                        addChatLine(chatLine, true);
                        $scope.requestTipDisabled = (getNumTipsAlreadySent() >= $scope.tips.length);
                    });
            }
        };

        /**
         * Each time a message should be sent, this functions determines
         * which action is performed. This can be either the sending of a help request
         * or the answering of a help request.
         */
        $scope.sendMessage = function() {

            let aMessage = $scope.note;

            // check if note is present
            if(!aMessage || aMessage === "" || typeof aMessage === "undefined") {
                $scope.sendHelpFormErrors = "Versuche dein Anliegen, im folgenden Feld zu beschreiben.";
                return false;
            }

            // select action depending on userBeingInspected
            let action = Promise.resolve();
            if(ProjectFactory.getProject().userBeingInspected) {
                action = teacherAnswerHelpRequest(aMessage);
            } else if(ProjectFactory.getProject().userRole === 'user') {
                action = sendHelpRequest(aMessage);
            }

            // if no error occurs, add chatline into the view
            action.catch(function (error) {
                $scope.sendHelpFormErrors = "Fehler beim Senden deiner Nachricht. Versuche es später noch einmal oder wende dich an den Systemadministrator.";
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
         *
         * @param chatLine
         * @returns {string}
         */
        $scope.getUserAvatar = function(chatLine) {

            let avatar;

            // avatar used for auto generated messages
            if(chatLine.author.username === avatarName) {

                // default avatar
                avatar = "../../../images/avatars/Avatar_RobyCoder_RZ_neutral_2020.svg";

                if(chatLine.type === "card") {
                    avatar = "../../../images/avatars/Avatar_RobyCoder_RZ_idea_2020.svg";
                }
            } else {

                // default human avatar = teacher
                avatar = "../../../images/avatars/Avatar_Teacher_RZ_2020.svg";

                // students avatar
                if(chatLine.author.username === chatLine.user.username) {
                    avatar = "../../../images/avatars/Avatar_Student_RZ_2020.svg";
                }
            }
            return avatar;
        };

        /**
         * Show send request form on click
         */
        $scope.showSendRequestForm = function() {
            $scope.sendRequestFormVisible = true;
        };
    }]);
