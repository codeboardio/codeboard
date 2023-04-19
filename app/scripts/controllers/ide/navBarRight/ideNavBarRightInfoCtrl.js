/**
 * This is the controller for the navBarRight Info-Tab
 *
 * @author Samuel Truniger
 * @date 19.04.2023
 *
 */
'use strict';
angular.module('codeboardApp').controller('ideNavBarRightInfoCtrl', [
    '$scope',
    function ($scope) {
        $scope.chatLines = [];
        let codingAssistantChatLine = {
            message: "Im Tab <span class='glyphicon glyphicon-eye-open'></span> <b>Erklärungen</b> findest du Erklärungen zu deinem geschriebenen Code in Textform. Öffne diesen Tab, falls du den Code genauer erklärt haben willst.",
            author: 'Helper-System - Coding Assistant',
            avatar: 'idea',
        };
        let tipChatLine = {
            message: "Im Tab <span class='glyphicon glyphicon-star'></span> <b>Tipps</b> kannst du Hinweise zur finalen Lösung anfragen. Falls du mit der Aufgabe gar nicht mehr weiterkommst kannst du über diesen Tab eine Frage an deinen Dozierenden stellen.",
            author: 'Helper-System - Tipps',
            avatar: 'idea',
        };
        let compilerChatLine = {
            message: "Im Tab <span class='glyphicon glyphicon-exclamation-sign'></span> <b>Compiler-Meldungen</b> findest du Erklärungen zu den Syntax-Fehlern im Code. Beachte, dass wenn du den Code via 'Run-Button' ausführst oder ihn via 'Test-Button' überprüfst, dieser Tab bei vorhandenen Syntax-Fehler automatisch aufgerufen wird.",
            author: 'Helper-System - Compiler-Meldungen',
            avatar: 'idea',
        };
        $scope.chatLines.push(codingAssistantChatLine, tipChatLine, compilerChatLine);
    },
]);
