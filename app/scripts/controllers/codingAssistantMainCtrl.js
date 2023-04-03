/**
 * This is the main controller for the navBarTab "Explanation" and the variable scope (Coding-Assistant).
 *
 *
 * @author Samuel Truniger
 * @date 20.03.2023
 */
"use strict";
angular.module("codeboardApp").controller("codingAssistantMainCtrl", [
    "$scope",
    "$timeout",
    "codingAssistantCodeMatchSrv",
    function ($scope, $timeout, codingAssistantCodeMatchSrv) {
        codingAssistantCodeMatchSrv.getJsonData().then(function (res) {
            var db = res;
            return codingAssistantCodeMatchSrv
                .getJsonColors()
                .then(function (colors) {
                    return { db: db, colors: colors };
                })
                .then(function (result) {
                    var db = result.db;
                    var colors = result.colors;
                    // Automatic function executed every 500 milliseconds
                    function updateExplanations() {
                        $scope.chatLines = [];
                        var inputCode = $scope.ace.editor
                            .getSession()
                            .getValue()
                            .replace(/ +/g, " ")
                            .replace(/\s*\;\s*$/g, ";");
                        var inputCodeArray = inputCode.split("\n");
                        var explanations = codingAssistantCodeMatchSrv.getMatchedExplanations(db, inputCodeArray, $scope.ace.editor, colors);

                        // Iterate through the combinedExplanations array for chatboxes
                        explanations.forEach((explanation) => {
                            let chatline = {
                                type: explanation.isError ? "error" : "explanation",
                                message: explanation.answer,
                                link: explanation.link,
                                author: "Roby erklärt Zeile " + explanation.lineLevel,
                                avatar: explanation.isError ? "worried" : "idea", //
                            };

                            $scope.chatLines.push(chatline);
                        });

                        // Update showNoCodeMessage property based on combinedExplanations array length
                        $scope.showNoCodeMessage = explanations.length === 0;
                    }

                    // MUST HAVE ANOTHER WAY TO IMPLEMENT THIS!!!! WAIT UNTIL ACE EDITOR IS LOADED
                    // Call updateExplanations() with a slight delay to ensure the initial code is loaded
                    $timeout(function () {
                        updateExplanations();
                    }, 100);

                    // Listen to the 'change' event of the Ace Editor
                    $scope.ace.editor.on("change", function () {
                        // Apply the changes to the scope
                        $scope.$apply(function () {
                            updateExplanations();
                        });
                    });
                });
        });
    },
]);
