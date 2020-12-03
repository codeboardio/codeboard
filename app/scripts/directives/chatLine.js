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

                /**
                 * Returns a well formed date
                 * @param date
                 * @returns {string}
                 */
                $scope.postedAt = function(date) {
                    let postedAt = new Date(date);
                    let options = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };
                    if(postedAt instanceof Date && !isNaN(postedAt)) {
                        return postedAt.toLocaleString("de-DE", options);
                    }
                    return "";
                };

                /**
                 * Returns the avatar uri for a given avatar name
                 * @param avatarName
                 * @returns {string}
                 */
                $scope.getAvatarUri = function(avatarName) {
                    switch (avatarName) {
                        case 'idea': return "../../../images/avatars/Avatar_RobyCoder_RZ_idea_2020.svg";
                        case 'neutral': return "../../../images/avatars/Avatar_RobyCoder_RZ_neutral_2020.svg";
                        case 'thumbUp': return "../../../images/avatars/Avatar_RobyCoder_RZ_thumb-up_2020.svg";
                        case 'almostRight': return "../../../images/avatars/Avatar_RobyCoder_RZ_almost-right_2020.svg";
                        case 'worried': return "../../../images/avatars/Avatar_RobyCoder_RZ_worried_2020.svg";
                        case 'student': return "../../../images/avatars/Avatar_Student_RZ_2020.svg";
                        case 'teacher': return "../../../images/avatars/Avatar_Teacher_RZ_2020.svg";
                        default: return "../../../images/avatars/Avatar_RobyCoder_RZ_neutral_2020.svg";
                    }
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
                onRateMessage: "&",
                messageId: '='
            },
            link: function ($scope, element) {

                // set defaults
                $scope.askUserText = $scope.askUserText || 'Wie hilfreich war dieser Tipp?';
                $scope.messageRated = false;
                $scope.grading = ['Überhaupt nicht hilfreich', 'Nicht hilfreich', 'Einigermassen hilfreich', 'Hilfreich', 'Sehr hilfreich'];


                // Scope Methods

                /**
                 * Method that is called when to user hits a rating
                 * @param i
                 */
                $scope.onRateSend = function(i) {
                    // call parent method if defined // todo messageId
                    if(angular.isDefined($scope.onRateMessage))
                        $scope.onRateMessage({id: $scope.messageId, rating: i});

                    $scope.messageRated = true;
                };

                /**
                 * Mark all lower stars on hover
                 * @param index
                 */
                $scope.onRateHover = function(index) {
                    for(let i = 1; i <= index; i++) {
                        angular.element(element[0].querySelector('.star'+i)).addClass('active');
                    }
                };

                /**
                 * Deselect all stars
                 * @param index
                 */
                $scope.onRateLeave = function (index) {
                    for(let i = 1; i <= index; i++) {
                        angular.element(element[0].querySelector('.star'+i)).removeClass('active');
                    }
                };


                // Watchers

                $scope.$watch('val', function(newValue, oldValue) {
                    if (newValue)
                        console.log("I see a data change!");
                }, true);

            },
            templateUrl: 'partials/chat/chatLineRating'
        };
    });
