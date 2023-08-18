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
        $scope.noteStudent = $scope.noteTeacher = "";

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
         * Returns the url to an avatar depending on user und message
         *
         * @param chatLine
         * @returns {string}
         */
        let getChatLineAvatar = function(chatLine) {
            if(chatLine.author.username === avatarName) {
                return (chatLine.type === "card") ? 'idea' : 'neutral';
            } else {
                return (chatLine.author.username === chatLine.user.username) ? 'student' : 'teacher';
            }
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

            // if chatLine type card, parse the message
            // if current user role is 'user' remove the reference
            if(chatLine.type === 'card') {
                chatLine.message = JSON.parse(chatLine.message);
                chatLine.message.cardReference = (ProjectFactory.getProject().userRole === 'user') ? null : chatLine.message.cardReference;
            }

            chatLine.avatar = getChatLineAvatar(chatLine);
            chatLine.author = chatLine.author.name || chatLine.author.username;
            chatLine.alignment = (chatLine.authorId !== chatLine.userId) ? 'left' : 'right';

            // add card to the list
            $scope.chatLines.push(chatLine);

            if(scrollToBottom) {
                chatScrollToBottom();
            }

            // re-empty note field
            $scope.noteStudent = "";
            $scope.noteTeacher = "";
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
         * Message that is emitted when a new message should be added to the help tab.
         */
        $scope.$on(IdeMsgService.msgAddHelpMessage().msg, function (event, data) {

            let chatline = {
                type: data.type,
                message: data.msg,
                author: data.sender,
                avatar: data.avatar
            };

            $scope.chatLines.push(chatline);

            chatScrollToBottom();
        });

        /**
         * This functions adds a chatline with a tip.
         */
        $scope.askForTip = function() {
            let tip = $scope.tips[getNumTipsAlreadySent()];
            if(typeof tip !== "undefined") {
                ChatSrv.addChatLineCard(tip.note, tip.name, 'tip', null, null, avatarName)
                    .then(function(aChatLine) {
                        addChatLine(aChatLine, true);
                        $scope.requestTipDisabled = (getNumTipsAlreadySent() >= $scope.tips.length);
                    });
            }
        };

        var lastHelpRequest = null;

        /**
         * This method is called by a student requires help for a project.
         * First create a new 'helpRequest' and then add a new chatline with reference
         * to the helpRequest.
         * @returns {*}
         */
        $scope.sendHelpRequest = function() {
            let noteStudent = $scope.noteStudent;
            if(!noteStudent || noteStudent === "" || typeof noteStudent === "undefined") {
                $scope.sendHelpFormErrors = "Nutze das darunterliegende Feld, um dein Anliegen zu beschreiben.";
                return false;
            }

            // trigger a save of the currently displayed content
            $rootScope.$broadcast(IdeMsgService.msgSaveCurrentlyDisplayedContent().msg);

            // call ProjectFactory to store the request
            return ProjectFactory.createHelpRequest()
                .then(function(helpRequest) {
                    lastHelpRequest = helpRequest;
                    let reference = "/projects/" + helpRequest.projectId + "/helprequests/" + helpRequest.id;
                    return ChatSrv.addChatLineCard(noteStudent,"Hilfe angefragt", 'help', reference, helpRequest.id);
                })
                .then(function(aChatLine) {
                    addChatLine(aChatLine, true);
                    $scope.sendRequestFormVisible = false;
                })
                .catch(function() {
                    $scope.sendHelpFormErrors = "Fehler beim Senden deiner Nachricht. Versuche es später noch einmal oder wende dich an den Systemadministrator.";
                });
        };

        /**
         * This method is called by a teacher to answer a students help request.
         * By doing so we first check the for valid message. Next we search for open
         * helpRequests and extract id of latest request. Then add new chatline with
         * reference to this request.
         */
        $scope.answerHelpRequest = function() {

            let noteTeacher = $scope.noteTeacher;
            if(!noteTeacher || noteTeacher === "" || typeof noteTeacher === "undefined") {
                $scope.sendHelpFormErrors = "Es wurde noch keine Antwort formuliert";
                return false;
            }

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
                    return ChatSrv.addChatLine(noteTeacher, id, UserSrv.getUsername(), 'html');
                })
                .then(function(chatLine) {
                    addChatLine(chatLine, true);
                })
                .catch(function() {
                    $scope.sendHelpFormErrors = "Beim Senden der Antwort ist ein Fehler aufgetreten. Bitte noch einmal versuchen";
                });
        };

        /**
         * Show send request form on click
         */
        $scope.showSendRequestForm = function() {
            $scope.sendRequestFormVisible = true;
        };
    }]);
