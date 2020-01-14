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
        let addChatLine = function(aMessage, type = 'text', user = null) {

            // data used for this call
            let username = ProjectFactory.getProject().userBeingInspected || UserSrv.getUsername(),
                projectId = $routeParams.projectId,
                payload = {
                    aMessage: (typeof aMessage === 'object') ? JSON.stringify(aMessage) : aMessage,
                    author: user || UserSrv.getUsername(),
                    type: type
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
         * retrieve chat history
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
            addChatLine: addChatLine
        };
    }]);
