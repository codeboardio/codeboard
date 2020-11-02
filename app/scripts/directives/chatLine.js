/**
 * Created by mict on 30/10/20.
 *
 * Different directives in the context of chat.
 */

'use strict';


/**
 * Directive used to display a chat conversation.
 * This directive takes a list of chatLines and adds for each value a <chat-line>.
 * Before the actual chat content, additional content can be inserted using the transclude 'beforeChat'.
 */
angular.module('codeboardApp')
    .directive('chat', function () {
        return {
            restrict: 'E',
            transclude: {
                beforeChat: '?beforeChat'
            },
            scope: {
                chatLines: "="
            },
            templateUrl: 'partials/chat/chat',
        };
    });


/**
 * Directive used to display a single chat line
 */
angular.module('codeboardApp')
    .directive('chatLine', function () {
        return {
            restrict: 'E',
            transclude: true,
            scope: {
                alignment: '@?',
                type: '@?',
                avatar: '@?',
                avatarSize: '@?',
                author: '@?',
                createdAt: '@?'
            },
            controller: ['$scope', function chatController($scope) {
                $scope.avatarSize = $scope.avatarSize || 'sm';
                $scope.avatar = $scope.avatar || '/images/avatars/Avatar_RobyCoder_RZ_neutral_2020.svg';

                $scope.postedAt = function(date) {
                    let postedAt = new Date(date);
                    let options = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };
                    if(postedAt instanceof Date && !isNaN(postedAt)) {
                        return postedAt.toLocaleString("de-DE", options);
                    }
                    return "";
                };
            }],
            templateUrl: 'partials/chat/chatLine'
        };
    });


/**
 * Directive used to display a chat line card
 */
angular.module('codeboardApp')
    .directive('chatLineCard', function () {
        return {
            restrict: 'E',
            transclude: true,
            scope: {
                cardType: "@?",
                cardReference: "@?",
                cardTitle: "@?"
            },
            controller: ['$scope', function chatController($scope) {
                $scope.alignment = $scope.alignment || 'left';
            }],
            templateUrl: 'partials/chat/chatLineCard'
        };
    });


/**
 * Directive used to display a simple chat line.
 * This can be used for both html and simple text.
 */
angular.module('codeboardApp')
    .directive('chatLineSimple', function () {
        return {
            restrict: 'E',
            transclude: true,
            templateUrl: 'partials/chat/chatLineSimple'
        };
    });


/**
 * An additional directive that can be used to display chat message rating.
 */
angular.module('codeboardApp')
    .directive('chatLineRating', function () {
        return {
            restrict: 'E',
            scope: {
                askUserText: '@?',
                onRateMessage: "&"
            },
            link: function ($scope, element) {

                // set defaults
                $scope.askUserText = $scope.askUserText || 'Wie hilfreich war dieser Tipp?';
                $scope.messageRated = false;

                // the grading in textform
                $scope.grading = ['Überhaupt nicht hilfreich', 'Nicht hilfreich', 'Einigermassen hilfreich', 'Hilfreich', 'Sehr hilfreich']

                $scope.onRateSend = function(i) {
                    // call parent method if defined // todo messageId
                    if(angular.isDefined($scope.onRateMessage))
                        $scope.onRateMessage({id: 5, rating: i});

                    $scope.messageRated = true;
                };

                // hover and leave actions to mark all stars with lower index
                $scope.onRateHover = function(index) {
                    for(let i = 1; i <= index; i++) {
                        angular.element(element[0].querySelector('.star'+i)).addClass('active');
                    }
                };
                $scope.onRateLeave = function (index) {
                    for(let i = 1; i <= index; i++) {
                        angular.element(element[0].querySelector('.star'+i)).removeClass('active');
                    }
                };
            },
            templateUrl: 'partials/chat/chatLineRating'
        };
    });
