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
    "$interval",
    "codingAssistantCodeMatchSrv",
    function ($scope, $interval, codingAssistantCodeMatchSrv) {
        $scope.explanationsString = "";
        // Automatic function executed every 500 millseconds
        function updateExplanations() {
            codingAssistantCodeMatchSrv
                .getJsonData()
                .then(function (res) {
                    var db = res;
                    return codingAssistantCodeMatchSrv.getJsonColors().then(function (colors) {
                        return { db: db, colors: colors };
                    });
                })
                .then(function (result) {
                    var db = result.db;
                    var colors = result.colors;
                    var inputCode = $scope.ace.editor
                        .getSession()
                        .getValue()
                        .replace(/ +/g, " ")
                        .replace(/\s*\;\s*$/g, ";");
                    var inputCodeArray = inputCode.split("\n");
                    $scope.explanationsString = codingAssistantCodeMatchSrv.getMatchedExplanations(db, inputCodeArray, $scope.ace.editor, colors);
                });

            document.getElementById("editorExp").innerHTML = $scope.explanationsString;
        }

        var intervalPromise = $interval(updateExplanations, 500);
        
        // Cancel the interval when the scope is destroyed
        $scope.$on("$destroy", function () {
            $interval.cancel(intervalPromise);
        });
    },
]);
