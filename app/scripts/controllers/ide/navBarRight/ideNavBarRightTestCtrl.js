/**
 * @author Janick Michot
 * @date 04.12.2020
 *
 */

'use strict';

angular.module('codeboardApp')

    /**
     * Controller for Tests in the "Test" tab
     */
    .controller('ideNavBarRightTestCtrl', ['$scope', '$rootScope', '$log', 'IdeMsgService', 'ProjectFactory', 'ChatSrv',
        function ($scope, $rootScope, $log, IdeMsgService, ProjectFactory, ChatSrv) {

            // enum for states and default state
            $scope.states = {
                notStarted: 1,
                inProgress: 2,
                compilationError: 3,
                ioError: 4,
                correctSolution: 5
            };
            $scope.state = $scope.states.notStarted;

            // io tests
            $scope.ioTestSet = [];
            let _ioTestSet = [];

            // compilation data
            $scope.compilation = {
                compilationError: false,
                id: '',
                output: '',
                status: 'pending', // fail | success
                compErrorHelpMessage: "",
                compilationErrorId: 0
            };

            // texts used in the template
            $scope.texts = {
                testButton: "Lösung überprüfen",
                avatar: "Damit du deine Lösung abgeben kannst, muss dein Programm alle Tests bestehen."
            };

            $scope.onSuccess = "";
            $scope.avatar = "neutral";


            /**
             * Shows text with a short delay and ...
             * @param text
             */
            let changeAvatarText = function(text) {
                $scope.texts.avatar = "...";
                setTimeout(function() {
                    $scope.texts.avatar = text;
                    $scope.$apply();
                },600);
            };

            /**
             * On init we extract the testing related information from codeboard.json
             */
            $scope.init = function() {
                if (ProjectFactory.hasConfig('Testing', 'ioTests')) {
                    let testingConfig = ProjectFactory.getConfig().Testing;
                    $scope.onSuccess = testingConfig.onSuccess;
                    testingConfig.ioTests.forEach(function(ioTest) {
                        _ioTestSet.push({
                            'name': ioTest.name,
                            'method': 'ioTest',
                            'status': 'pending', // fail | success
                            'input': ioTest.input,
                            'tests': ioTest.tests,
                            'result': {},
                            'output': '',
                            'expectedOutput': ioTest.expectedOutput,
                            'stopOnFailure': ioTest.stopOnFailure || false,
                            'id': '',
                            'open': false
                        });
                    });
                    $scope.ioTestSet = _ioTestSet;
                } else {
                    $scope.testingDisabled = true;
                }
            };
            $scope.init();


            /**
             * todo how can we access this method from outside?
             *  so we dont need a sepearate execution when the student has a comp error in run
             *  instead we can call this function with the compResult
             */
            let setCompilationResult = function(compilationResult) {
                $scope.compilation.compilationError = compilationResult.compilationError;
                $scope.compilation.id = compilationResult.id;
                $scope.compilation.output = compilationResult.output;
                $scope.compilation.compilationErrorId = compilationResult.compilationErrorId;
                $scope.compilation.compErrorHelpMessage = compilationResult.compErrorHelpMessage;
                $scope.compilation.status = compilationResult.compilationError ? 'fail' : 'success';
            };

            /**
             * @returns {*}
             */
            let ioTesting = function(compilationId = 0) {

                // reset tests
                $scope.ioTestSet = _ioTestSet;

                let hasErrors = false;
                let i = 0;
                return _ioTestSet.reduce(function (promiseChain, test) {

                    // Note, Promise.resolve() resolve is our initial value
                    return promiseChain.then(function (id) {

                        // dont make any further tests after 'stopOnFailure'
                        if(i > 0 && id === 0) {
                            test.status = "unreachable";
                            $scope.ioTestSet[i] = test;
                            i++;
                            return 0;
                        }

                        $scope.ioTestSet[i].status = 'processing';

                        // set compilation/run id from last call
                        test.id = id;

                        return ProjectFactory.testProject(test)
                            .then(function(testResult) {

                                // prepare the variable to be returned
                                let ret = testResult.id;

                                // update testData
                                $scope.ioTestSet[i] = testResult;

                                // check if test failed
                                if(testResult.status === 'fail') {

                                    // we dont want to show avatar when an error occurred
                                    $scope.showAvatar = false;

                                    // expand the first error
                                    $scope.ioTestSet[i].open = false;
                                    if(!hasErrors) {
                                        $scope.ioTestSet[i].open = true;
                                        hasErrors = true;
                                    }

                                    // stop further tests if 'stopOnFailure' is set
                                    if(testResult.stopOnFailure) {
                                        ret = 0;
                                    }
                                }

                                // count and return either id of testResult or 0 if stopOnFailure
                                i++;
                                return ret;
                            });
                    });
                }, Promise.resolve(compilationId) )
                    .then(function() {
                        return hasErrors;
                    });
            };


            /**
             * Test Project
             */
            $scope.doTheIoTesting = function() {
                $log.debug('Test request received');

                // trigger a save of the currently displayed content
                $rootScope.$broadcast(IdeMsgService.msgSaveCurrentlyDisplayedContent().msg);

                $scope.state = $scope.states.inProgress;
                $scope.compilation.status = 'pending';

                changeAvatarText("Ich bearbeite nun deinen Code.");

                // before actual testing we close all the panes
                for (let i = 0; i < $scope.ioTestSet.length; i++) {
                    $scope.ioTestSet[i].open = false;
                }

                // set clean compilation, stream and compErrorHelp
                return ProjectFactory.compileProject(true, false, true)
                    .then(function(compilationResult) {
                        setCompilationResult(compilationResult);
                        return compilationResult;
                    })
                    .then(function(compilationResult) {
                        $scope.state = (compilationResult.compilationError) ? $scope.states.compilationError : $scope.states.inProgress;

                        if (compilationResult.compilationError) {
                            let reqOpenCompilerTab = IdeMsgService.msgNavBarRightOpenTab('compiler');
                            $rootScope.$broadcast(reqOpenCompilerTab.msg, reqOpenCompilerTab.data);

                            let chatLineCard = {
                                cardHeader: 'Fehler beim Testen',
                                cardBody: compilationResult.compErrorHelpMessage,
                                cardType: 'compHelp',
                                compilationOutput: compilationResult.output,
                                compilationErrorId: compilationResult.compilationErrorId
                            };

                            let reqAddMsg = IdeMsgService.msgAddHelpMessage(chatLineCard, 'compilerTest', 'Roby', 'worried');
                            $rootScope.$broadcast(reqAddMsg.msg, reqAddMsg.data);
                            
                            // broadcast event that code gets compiled and has a syntax-error
                            $rootScope.$broadcast('compilerError');
                            $scope.state = $scope.states.compilationError;

                        } else {
                            $scope.state = $scope.states.inProgress;

                            ioTesting(compilationResult.id)
                                .then(function(hasIoErrors) {

                                    if (hasIoErrors) {
                                        $scope.state = $scope.states.ioError;
                                    } else {
                                        $scope.state = $scope.states.correctSolution;
                                        changeAvatarText($scope.onSuccess);
                                    }
                                    $scope.texts.testButton = "Lösung erneut überprüfen?";

                                    // change avatar
                                    $scope.avatar = "thumbUp";

                                    // force update of scope (used for status)
                                    $scope.$apply();
                                });
                            // broadcast event that code gets compiled and has no syntax error (make sure with $timeout that the chatbox is available)
                            $rootScope.$broadcast('noCompilerError');
                        }
                    })
                    .catch(function(error) {
                        // console.log(error);
                        $log.debug(error);
                    });
            };


            /**
             * listen to test project events
             */
            $scope.$on(IdeMsgService.msgNavBarRightOpenTab().msg, function (event, data) {
                if(data.tab === 'test' && data.doIoTest) {
                    $scope.doTheIoTesting();
                }
            });

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
                }
            };
        }]);
