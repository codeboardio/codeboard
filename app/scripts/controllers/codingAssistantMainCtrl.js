/**
 * This is the main controller for the navBarTab "Explanation" and the variable scope (Coding-Assistant).
 *
 *
 * @author Samuel Truniger
 * @date 20.03.2023
 */
'use strict';
angular.module('codeboardApp').controller('codingAssistantMainCtrl', [
    '$scope',
    '$timeout',
    'codingAssistantCodeMatchSrv',
    function ($scope, $timeout, codingAssistantCodeMatchSrv) {
        var aceEditor = $scope.ace.editor;

        codingAssistantCodeMatchSrv
            .getJsonData()
            .then(function (res) {
                var db = res;
                return codingAssistantCodeMatchSrv
                    .getJsonColors()
                    .then(function (colors) {
                        return { db: db, colors: colors };
                    })
                    .then(function (result) {
                        var db = result.db;
                        var colors = result.colors;
                        // Automatic function executed one time at the beginning and then every time the code in the editor changes
                        function updateExplanations() {
                            $scope.chatLines = [];
                            var inputCode = $scope.ace.editor
                                .getSession()
                                .getValue()
                                .replace(/ +/g, ' ')
                                .replace(/\s*\;\s*$/g, ';');
                            var inputCodeArray = inputCode.split('\n');
                            var result = codingAssistantCodeMatchSrv.getMatchedExplanations(db, inputCodeArray, aceEditor, colors);

                            // Iterate through the combinedExplanations array to generate the chatboxes
                            result.explanations.forEach((explanation) => {
                                let chatline = {
                                    type: explanation.isError ? 'error' : 'explanation',
                                    message: explanation.answer,
                                    link: explanation.link,
                                    author: 'Roby erklärt Zeile ' + explanation.lineLevel,
                                    avatar: explanation.isError ? 'worried' : 'idea',
                                };

                                $scope.chatLines.push(chatline);
                            });

                            // Update showNoCodeMessage element based on combinedExplanations array length
                            $scope.showNoCodeMessage = result.explanations.length === 0;
                        }

                        // MUST HAVE ANOTHER WAY TO IMPLEMENT THIS!!!! WAIT UNTIL ACE EDITOR IS LOADED
                        // Call updateExplanations() with a slight delay to ensure the initial code is loaded
                        $timeout(function () {
                            updateExplanations();
                        }, 100);

                        // Listen to the 'change' event of the Ace Editor / got the Code from the Ace Docs - https://ace.c9.io/#nav=howto
                        aceEditor.on('change', function () {
                            // Automatically call $apply if necessarry to prevent '$apply already in progress' error
                            $timeout(function () {
                                updateExplanations();
                            });
                        });
                    });
            })
            .catch(function (error) {
                console.error('An error occurred while fetching data:', error);
            });
    },
]);
