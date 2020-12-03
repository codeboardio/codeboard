/**
 * @author Janick Michot
 * @date 19.12.2019
 *
 * todo create init function where we load tests. If an error occurs dont allow to do the ioTest. Instead
 *  show an error message. So we dont have to load the tests each time.
 */

'use strict';

angular.module('codeboardApp')

    /**
     * Controller for Tips
     */
    .controller('ideNavBarRightTestCtrl', ['$scope', '$rootScope', '$log', 'IdeMsgService', 'ProjectFactory', 'ChatSrv',
        function ($scope, $rootScope, $log, IdeMsgService, ProjectFactory, ChatSrv) {

            let testSet = {};

            // title and description
            $scope.ioTestButtonText = "Lösung überprüfen";
            $scope.inProgress = false;
            $scope.correctSolution = false;
            $scope.compileError = false;
            $scope.compilationErrorId = null;

            // test related variables
            $scope.compilationResult = { inProgress: true };
            $scope.tests = [];

            // show/hide avatar and avatars text
            $scope.showAvatar = true;
            $scope.avatarSays = "Damit du deine Lösung abgeben kannst, muss dein Programm alle Tests bestehen.";

            /**
             *  todo avatar mit fade effect ersetzen
             */
            let changeAvatar = function() {
                $scope.avatarFade = true;
                setTimeout(function() {
                    $scope.avatarFade = false;
                    $scope.$apply();
                },1000);
            };

            /**
             * Shows text with a short delay and ...
             *
             * todo typing effect einbauen
             *
             * @param text
             */
            let changeAvatarText = function(text) {
                $scope.avatarSays = "...";
                setTimeout(function(){
                    $scope.avatarSays = text;
                    $scope.$apply();
                },600);
            };


            /**
             * On init we load and display all the tests related to the project
             */
            $scope.init = function() {
                ProjectFactory.getTests()
                    .then(function(data) {
                        if(data.fail) {
                            $scope.inProgress = false;
                            $scope.disableTesting = true;
                        } else {
                            $scope.tests = testSet = data.tests;
                            $scope.onSuccessMessage = data.onSuccess;
                            $scope.compilationResult.inProgress = false;
                        }
                    });
            };
            $scope.init();



            /**
             * Test Project
             */
            $scope.doTheIoTesting = function() {
                $log.debug('Test request received');

                // trigger a save of the currently displayed content
                $rootScope.$broadcast(IdeMsgService.msgSaveCurrentlyDisplayedContent().msg);

                let hasErrors = false;

                $scope.inProgress = true;
                $scope.correctSolution = false;
                $scope.compileError = false;
                $scope.showAvatar = true;

                changeAvatarText("Ich bearbeite nun deinen Code.");

                // before actual testing we close all the panes
                for (let i = 0; i < $scope.tests.length; i++) {
                    $scope.tests[i].open = false;
                }

                // do io-test asynchronously one after another
                let i = 0;
                return testSet.reduce(function (promiseChain, test) {

                    // Note, Promise.resolve() resolve is our initial value
                    return promiseChain.then(function (id) {

                        // dont make any further tests after 'stopOnFailure'
                        if(i > 0 && id === 0) {
                            test.status = "unreachable";
                            $scope.tests[i] = test; i++;
                            return 0;
                        }

                        $scope.tests[i].status = 'processing';

                        // set compilation/run id from last call
                        test.id = id;

                        return ProjectFactory.testProject(test)
                            .then(function(testResult) {

                                // prepare the variable to be returned
                                let ret = testResult.id;

                                // update testData
                                $scope.tests[i] = testResult;

                                // check if test failed
                                if(testResult.status === 'fail') {

                                    // we dont want to show avatar when an error occurred
                                    $scope.showAvatar = false;

                                    // expand the first error
                                    $scope.tests[i].open = false;
                                    if(!hasErrors) {
                                        $scope.tests[i].open = true;
                                        hasErrors = true;
                                    }

                                    // stop further tests if 'stopOnFailure' is set
                                    if(testResult.stopOnFailure) {
                                        if(testResult.method === "compileTest") {
                                            $scope.tests[i].name = "Fehler beim Kompilieren";
                                            $scope.compileError = true;
                                            console.log(testResult);
                                            console.log(testResult.compilationErrorId);

                                            // used to identify compilation message rating
                                            $scope.compilationErrorId = testResult.compilationErrorId;
                                        }
                                        ret = 0;
                                    }
                                }

                                // count and return either id of testResult or 0 if stopOnFailure
                                i++; return ret;
                            });
                        });
                }, Promise.resolve() )

                .then(function() {

                    $scope.numTestsPassed = $scope.tests.filter(test => { return (test.status === 'success'); }).length;
                    $scope.numTestsFailed = $scope.tests.filter(test => { return (test.status !== 'success'); }).length;
                    $scope.testResult = (1 / $scope.tests.length * $scope.numTestsPassed);
                    $scope.correctSolution = ($scope.testResult === 1);

                    // change scope variables
                    $scope.ioTestButtonText = "Lösung erneut überprüfen?";
                    $scope.inProgress = false;

                    // change avatar
                    changeAvatarText($scope.onSuccessMessage);

                    // force update of scope (used for status)
                    $scope.$apply();
                })
                .catch(function(error) {
                    $log.debug(error);
                });
            };


            /**
             * listen to test project events
             */
            $scope.$on(IdeMsgService.msgNavBarRightOpenTab().msg, function (event, data) {
                if(data.tab === 'test') {
                    $scope.doTheIoTesting();
                }
            });

            /**
             * Return avatar depending on current status
             * @returns {string}
             */
            $scope.getAvatar = function() {
                return ($scope.correctSolution) ? 'thumpUp' : 'neutral';
            };

            /**
             * because the html of different test methods can vary, this functions cis used to load the html for
             * a certain test method
             * @param method
             * @returns {string}
             */
            $scope.getTestMethodOutput = function(method) {
                switch (method) {
                    case 'ioTest':
                        return 'ideIoTestResult.html';
                    case 'compileTest':
                        return 'ideCompileTestResult.html';
                }
            };

            /**
             * This method is bound to the chatLine rating directive.
             * When the message is rated this method calls the chatService to
             * send the rating to the api.
             * @param messageId
             * @param rating
             */
            $scope.onMessageRating = function (messageId, rating) {
                ChatSrv.rateCompilationErrorMessage(messageId, rating)
                    .then(function() {
                        console.log("Saved your rating");
                    });
            };
        }]);
