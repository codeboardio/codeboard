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
            $scope.textBefore = "Damit du deine Lösung abgeben kannst, muss dein Programm alle Tests bestehen.";
            $scope.ioTestButtonText = "Lösung überprüfen";
            $scope.inProgress = false;
            $scope.correctSolution = false;
            $scope.compileError = false;

            // test related variables
            $scope.compilationResult = { 'inProgress': true };
            $scope.tests = [];



            /**
             * todo was muss die init-funktion machen?
             */
            $scope.init = function() {
                //
            };
            $scope.init();


            /**
             * Test Project
             */
            $scope.doTheIoTesting = function() {
                $log.debug('Test request received');

                let hasErrors = false;

                // replace title during testing
                $scope.title = "Deine Lösung wird überprüft";
                $scope.inProgress = true;

                // get all tests related to this project
                ProjectFactory.getTests()
                    .then(function(data) {

                        if(data.fail) {
                            Promise.reject("Fehlgeschlagen: " + data.msg);
                        }

                        // store data/tests to scope and stop spinning
                        $scope.tests = data.tests;
                        $scope.compilationResult.inProgress = false;
                        return data;
                    })
                    .then(function(data) {

                        let i = 0;

                        // do io-test asynchronously one after another
                        return data.tests.reduce(function (promiseChain, test) {

                            // Note, Promise.resolve() resolve is our initial value
                            return promiseChain.then(function (id) {

                                // dont make any further tests after `stopOnFailure`
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

                                        // expand the first error
                                        $scope.tests[i].open = false;
                                        if(testResult.status === 'fail' && !hasErrors) {
                                            $scope.tests[i].open = true;
                                            hasErrors = true;
                                        }

                                        // stop further tests if `stopOnFailure` is set
                                        if(testResult.stopOnFailure && testResult.status === 'fail') {
                                            if(testResult.method === "compileTest") {
                                                $scope.tests[i].name = "Fehler beim Kompilieren";
                                                $scope.compileError = true;
                                            }
                                            ret = 0;
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
                            $scope.inProgress = false;
                            $scope.ioTestButtonText = "Lösung erneut überprüfen?";

                            // force update of scope (used for status)
                            $scope.$apply();
                        });
                    })
                    .catch(function(error) {
                        console.log(error);
                    });
            };


            /**
             * listen to test project events
             */
            $scope.$on(IdeMsgService.msgTestRequestNew().msg, function () {
                // trigger open tab event
                let req = IdeMsgService.msgNavBarRightOpenTab('test');
                $rootScope.$broadcast(req.msg, req.data);

                // start testing
                $scope.doTheIoTesting();
            });





            /**
             * because we can not trigger navBarClick from within the modal, we need
             * to define a separate functions
             */
            $scope.submitAfterTest = function() {
                let req = IdeMsgService.msgSubmitRequest();
                $rootScope.$broadcast(req.msg);
            };
            $scope.helpAfterTest = function() {
                let req = IdeMsgService.msgHelpRequest();
                $rootScope.$broadcast(req.msg);
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
