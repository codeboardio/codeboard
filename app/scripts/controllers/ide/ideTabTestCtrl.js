/**
 * @author Janick Michot
 * @date 19.12.2019
 */

'use strict';

angular.module('codeboardApp')

    /**
     * Controller for Tips
     */
    .controller('ideTabTestCtrl', ['$scope', '$rootScope', '$log', 'IdeMsgService', 'ProjectFactory',
        function ($scope, $rootScope, $log, IdeMsgService, ProjectFactory) {

            // title and description
            $scope.title = "Lass deine Lösung überprüfen";
            $scope.ioTestButtonText = "Lösung überprüfen";
            $scope.inProgress = false;
            $scope.correctSolution = false;
            $scope.compileError = false;

            // test related variables
            $scope.compilationResult = { 'inProgress': true };
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
             * Test Project
             */
            $scope.doTheIoTesting = function() {
                $log.debug('Test request received');

                // trigger a save of the currently displayed content
                $rootScope.$broadcast(IdeMsgService.msgSaveCurrentlyDisplayedContent().msg);

                let hasErrors = false;

                // replace title during testing
                $scope.title = "Deine Lösung wird überprüft";
                $scope.correctSolution = false;
                $scope.inProgress = true;

                // change avatar
                $scope.showAvatar = true;
                changeAvatarText("Ich bearbeite nun deinen Code.");

                // get all tests related to this project
                ProjectFactory.getTests()
                    .then(function(data) {
                        // break promise chain, when we dont receive any tests
                        if(data.fail) {
                            changeAvatarText("Es ist ein Fehler aufgetreten. Bitte wende dich an den Kursleiter");
                            $scope.inProgress = false;
                            $scope.disableTesting = true;
                            return Promise.reject( "Fehlgeschlagen: " + data.msg );
                        }

                        // store data/tests to scope and stop spinning
                        $scope.tests = data.tests;
                        $scope.onSuccessMessage = data.onSuccess;
                        $scope.compilationResult.inProgress = false;
                        return data;
                    })
                    .then(function(data) {

                        // do io-test asynchronously one after another
                        let i = 0;
                        return data.tests.reduce(function (promiseChain, test) {

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
                                                }
                                                ret = 0;
                                            }
                                        }

                                        // count and return either id of testResult or 0 if stopOnFailure
                                        i++; return ret;
                                    });
                                });
                        }, Promise.resolve() )

                        .then(function(testResult) {

                            // create summary
                            $scope.numTestsPassed = $scope.tests.filter(test => { return (test.status === 'success'); }).length;
                            $scope.numTestsFailed = $scope.tests.filter(test => { return (test.status !== 'success'); }).length;
                            $scope.testResult = (1 / $scope.tests.length * $scope.numTestsPassed);
                            $scope.correctSolution = ($scope.testResult === 1);

                            // define title
                            let title = "";
                            if($scope.correctSolution) {
                                title = "Deine Lösung ist richtig";
                            } else if ($scope.compileError) {
                                title = "Fehler bei der Kompilierung";
                            } else {
                                title = "Überprüfung abgeschlossen";
                            }

                            // change scope variables
                            $scope.title = title;
                            $scope.ioTestButtonText = "Lösung erneut überprüfen?";
                            $scope.inProgress = false;

                            // change avatar
                            changeAvatarText($scope.onSuccessMessage);

                            // force update of scope (used for status)
                            $scope.$apply();
                        });
                    })
                    .catch(function(error) {
                        $log.debug(error);
                        console.log("aaa");
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
                let avatar = "../../../images/avatars/Avatar_RobyCoder_RZ_neutral_2020.svg";

                if($scope.correctSolution) {
                    avatar = "../../../images/avatars/Avatar_RobyCoder_RZ_thumb-up_2020.svg";
                }
                return avatar;
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

        }]);
