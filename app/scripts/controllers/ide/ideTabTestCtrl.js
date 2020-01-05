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

                console.log("DoTheIOThing");

                // replace title during testing
                let _title = $scope.title;
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
                                        // update testData
                                        $scope.tests[i] = testResult; i++;

                                        if(testResult.stopOnFailure && testResult.status === 'fail') {
                                            return 0;
                                        }
                                        return testResult.id;
                                    });
                                });
                        }, Promise.resolve() )

                        .then(function(testResult) {

                            // create summary
                            $scope.numTestsPassed = $scope.tests.filter(test => { return (test.status === 'success'); }).length;
                            $scope.numTestsFailed = $scope.tests.filter(test => { return (test.status !== 'success'); }).length;
                            $scope.testResult = (1 / $scope.tests.length * $scope.numTestsPassed);

                            // change title back
                            $scope.title = _title;
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
