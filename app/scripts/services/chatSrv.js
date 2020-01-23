/**
 *
 * @author Janick Michot
 */

'use strict';

angular.module('codeboardApp')
    .service('ChatSrv',['$rootScope', '$routeParams', '$q', 'SessionRes', '$location', 'ChatRes', 'UserSrv', 'ProjectFactory',
        function ChatService($rootScope, $routeParams, $q, SessionRes, $location, ChatRes, UserSrv, ProjectFactory) {

        /**
         * add chat line
         */
        let addChatLine = function(aMessage, helpRequestId = null, user = null, type = "text") {

            // data used for this call
            let username = ProjectFactory.getProject().userBeingInspected || UserSrv.getUsername(),
                projectId = $routeParams.projectId,
                payload = {
                    aMessage: (typeof aMessage === 'object') ? JSON.stringify(aMessage) : aMessage,
                    author: user || UserSrv.getUsername(),
                    type: type,
                    helpRequestId: helpRequestId
                };

            // create the promise that is returned
            let deferred = $q.defer();

            // make call to the server
            ChatRes.save( { projectId: projectId, username: username }, payload,
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
         * Creates a chat line with type card used for `helprequests` and `tips`
         *
         * @param aMessage
         * @param aHeader
         * @param aType
         * @param aReference
         * @param helpRequestId
         * @param user
         * @returns {*}
         */
        let addChatLineCard = function(aMessage, aHeader, aType = "help", aReference = null, helpRequestId = null, user = null) {

            // prepare card
            let card = {
                cardHeader: aHeader,
                cardBody: aMessage,
                cardType: aType,
                cardReference: aReference
            };

            // add chatline
            return addChatLine(JSON.stringify(card), helpRequestId, user, "card");
        };

        /**
         * Retrieve chat history
         * @returns {*}
         */
        let getChatHistory = function () {
            // data used for this call
            let username = ProjectFactory.getProject().userBeingInspected || UserSrv.getUsername(),
                projectId = $routeParams.projectId,
                payload = { };

            // create the promise that is returned
            let deferred = $q.defer();

            // make call to the server
            ChatRes.get( { projectId: projectId, username: username }, payload,
                function success(data) {
                    deferred.resolve(data);
                },
                function error(response) {
                    deferred.reject(response);
                }
            );
            return deferred.promise;
        };


        return {
            getChatHistory: getChatHistory,
            addChatLine: addChatLine,
            addChatLineCard: addChatLineCard
        };
    }]);
