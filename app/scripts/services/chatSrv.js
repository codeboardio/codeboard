/**
 *
 * @author Janick Michot
 */

'use strict';

angular.module('codeboardApp').service('ChatSrv', [
    '$rootScope',
    '$routeParams',
    '$q',
    'SessionRes',
    '$location',
    'ChatRes',
    'ChatLineRes',
    'UserSrv',
    'ProjectFactory',
    function ChatService($rootScope, $routeParams, $q, SessionRes, $location, ChatRes, ChatLineRes, UserSrv, ProjectFactory) {
        /**
         * add chat line
         */
        let addChatLine = function (aMessage, helpRequestId = null, user = null, type = 'text') {
            // data used for this call
            let username = ProjectFactory.getProject().userBeingInspected || UserSrv.getUsername(),
                projectId = $routeParams.projectId,
                payload = {
                    aMessage: typeof aMessage === 'object' ? JSON.stringify(aMessage) : aMessage,
                    author: user || UserSrv.getUsername(),
                    type: type,
                    helpRequestId: helpRequestId,
                };

            // create the promise that is returned
            let deferred = $q.defer();

            // make call to the server
            ChatRes.save(
                { projectId: projectId, username: username },
                payload,
                function success(data) {
                    deferred.resolve(data);
                },
                function error(response) {
                    deferred.reject(response);
                }
            );
            return deferred.promise;
        };

        /**
         * Creates a chat line with type card used for 'helprequests' and 'tips'
         *
         * @param aMessage
         * @param aHeader
         * @param aType
         * @param aReference
         * @param helpRequestId
         * @param user
         * @param aStatus
         * @param aTipIndex
         * @returns {*}
         */
        let addChatLineCard = function (aMessage, aHeader, aType = 'help', aReference = null, helpRequestId = null, user = null, aStatus = null, aTipIndex = null) {
            // prepare card
            let card = {
                cardHeader: aHeader,
                cardBody: aMessage,
                cardType: aType,
                cardReference: aReference,
            };
            if (aType === 'tip') {
                card.tipSent = aStatus;
                card.tipIndex = aTipIndex;
                // add chatline for tips
                return addChatLine(JSON.stringify(card), helpRequestId, user, 'hint');
            } else if (aType === 'help') {
                // console.log(card);
                // add chatline for helprequests
                return addChatLine(JSON.stringify(card), helpRequestId, user, 'helpRequest');
            }
        };

        /**
         * Retrieve chat history
         * @returns {*}
         */
        let getChatHistory = function () {
            // data used for this call
            let username = ProjectFactory.getProject().userBeingInspected || UserSrv.getUsername(),
                projectId = $routeParams.projectId,
                payload = {};

            // create the promise that is returned
            let deferred = $q.defer();

            // make call to the server
            ChatRes.get(
                { projectId: projectId, username: username },
                payload,
                function success(data) {
                    deferred.resolve(data);
                },
                function error(response) {
                    // console.log(response);
                    deferred.reject(response);
                }
            );
            return deferred.promise;
        };

        /**
         * Rate a compilation error message
         * todo This method should be replaced when the chat is rebuilt
         * @param chatMessageId
         * @param rate
         */
        let rateCompilationErrorMessage = function (chatMessageId, rate) {
            let deferred = $q.defer();
            ChatLineRes.update(
                { chatLineId: chatMessageId },
                { rating: rate },
                function success(data, status, header, config) {
                    deferred.resolve();
                },
                function error(data, status, header, config) {
                    deferred.reject();
                }
            );
            return deferred.promise;
        };

        return {
            getChatHistory: getChatHistory,
            addChatLine: addChatLine,
            addChatLineCard: addChatLineCard,
            // rateMessage: rateMessage
            rateCompilationErrorMessage: rateCompilationErrorMessage,
        };
    },
]);
