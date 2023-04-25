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
    '$rootScope',
    '$timeout',
    '$document',
    'codingAssistantCodeMatchSrv',
    'AceEditorSrv',
    function ($scope, $rootScope, $timeout, $document, codingAssistantCodeMatchSrv, AceEditorSrv) {
        var aceEditor = $scope.ace.editor;
        var errorLine;
        var currentLine;

        // fetch db and colors data from codingAssistantCodeMatchSrv
        function fetchData() {
            return codingAssistantCodeMatchSrv
                .getJsonData()
                .then((db) => {
                    return codingAssistantCodeMatchSrv.getJsonColors().then((colors) => {
                        return { db, colors };
                    });
                })
                .catch((error) => {
                    console.error('An error occurred while fetching data:', error);
                });
        }

        fetchData().then(({ db, colors }) => {
            // call updateExplanations() to show message, when no file is opened
            updateExplanations(db, colors);

            // Call updateExplanations() with a slight delay to ensure the initial code is loaded
            $scope.$on('fileOpenend', function () {
                $timeout(() => {
                    updateExplanations(db, colors);
                });
            });

            // call change listener in ace service
            AceEditorSrv.aceChangeListener(aceEditor, function () {
                // Automatically call $apply if necessarry to prevent '$apply already in progress' error
                $timeout(function () {
                    updateExplanations(db, colors);
                });
                // call clearMarker function to clear the markers array every time the code changes
                codingAssistantCodeMatchSrv.addDynamicMarkers(aceEditor);
            });
        });

        // Automatic function executed one time at the beginning / when a file is openend and then every time the code in the editor changes
        function updateExplanations(db, colors) {
            $scope.chatLines = [];

            // get current code from aceEditor
            var inputCode = aceEditor
                .getSession()
                .getValue()
                .replace(/ +/g, ' ')
                .replace(/\s*\;\s*$/g, ';');
            var inputCodeArray = inputCode.split('\n');
            var result = codingAssistantCodeMatchSrv.getMatchedExplanations(db, inputCodeArray, aceEditor, colors);

            // convert variableMap into an object
            $rootScope.variableMap = Object.fromEntries(result.variableMap);

            // Iterate through the explanations array to generate the chatboxes
            result.explanations.forEach((explanation) => {
                if (explanation.isError) {
                    // lineLevel of error chatbox
                    errorLine = explanation.lineLevel;
                    // current lineLevel of cursor
                    currentLine = aceEditor.getSelectionRange().start.row + 1;
                    let chatline = {
                        type: 'error',
                        message: explanation.answer,
                        link: explanation.link,
                        lineLevel: explanation.lineLevel,
                        author: 'Roby erklärt Zeile ' + explanation.lineLevel,
                        avatar: 'worried',
                    };
                    // show checkbox when line changed
                    if (currentLine !== errorLine) {
                        $scope.chatLines.push(chatline);
                    }
                } else {
                    let chatline = {
                        type: 'explanation',
                        message: explanation.answer,
                        link: explanation.link,
                        lineLevel: explanation.lineLevel,
                        author: 'Roby erklärt Zeile ' + explanation.lineLevel,
                        avatar: 'idea',
                    };
                    $scope.chatLines.push(chatline);
                }
            });

            // Update showNoCodeMessage element based on combinedExplanations array length
            $scope.showNoCodeMessage = result.explanations.length === 0;
        }

        // call mouseclick listener in ace service
        AceEditorSrv.mouseDownListener(aceEditor, function (e) {
            $rootScope.cursorPosition = e.getDocumentPosition().row + 1;
            $scope.$apply();

            var chatBoxId = 'chatLine-' + $rootScope.cursorPosition;
            // get corresponding chatbox
            var chatBox = $document[0].getElementById(chatBoxId);
            // check if the chat line with the corresponding line level exists
            if (chatBox) {
                // scroll the chatbox to the associated line in the codeEditor
                chatBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        // call enterKey listener in ace service
        AceEditorSrv.enterKeyListener(aceEditor, function (e) {
            // Check if the key pressed is 'Enter'
            if (e.key === 'Enter' || e.keyCode === 13) {
                $rootScope.cursorPosition = -1;
                $scope.$apply();
            }
        });
    },
]);
