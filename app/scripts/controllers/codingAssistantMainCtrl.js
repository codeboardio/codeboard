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
  'CodingAssistantCodeMatchSrv',
  'TabService',
  'AceEditorSrv',
  function ($scope, $rootScope, $timeout, $document, CodingAssistantCodeMatchSrv, TabService, AceEditorSrv) {
    var aceEditor = $scope.ace.editor;
    var errorLine;
    var currentLine;
    var startCode = 0;
    $scope.cursorPosition = -1;

    // fetch db and colors data from CodingAssistantCodeMatchSrv
    function fetchData() {
      return CodingAssistantCodeMatchSrv.getJsonData()
        .then((db) => {
          return CodingAssistantCodeMatchSrv.getJsonColors().then((colors) => {
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

      // call updateExplanations when the user open the explanations tab
      $rootScope.$on('tabClicked', function () {
        var doc = aceEditor.getSession().getDocument();
        var lineCount = doc.getLength();

        // find first line with some code
        for (var i = 0; i < lineCount; i++) {
          var line = doc.getLine(i);
          if (line.trim() !== '') {
            startCode = i + 1;
            break;
          }
        }
        $scope.cursorPosition = startCode;
        // move cursor to startCode line
        aceEditor.gotoLine(startCode, 0);

        updateExplanations(db, colors);

        $timeout(() => {
          highlightChatbox(startCode);
        });
      });

      // Call updateExplanations() with a slight delay to ensure the initial code is loaded
      $scope.$on('fileOpenend', function () {
        $timeout(() => {
          if (TabService.getSlug() === 'explanation') {
            updateExplanations(db, colors);
          }
        });
      });

      // call change listener in ace service
      AceEditorSrv.aceChangeListener(aceEditor, function () {
        // automatically call $apply if necessarry to prevent '$apply already in progress' error
        $timeout(() => {
          if (TabService.getSlug() === 'explanation') {
            updateExplanations(db, colors);
          }
        });
        // add markers dynamically
        // CodingAssistantCodeMatchSrv.addDynamicMarkers(aceEditor);

        $rootScope.$broadcast('codeChanged');
      });
    });

    // Automatic function executed one time at the beginning / when a file is openend and then every time the code in the editor changes
    function updateExplanations(db, colors) {
      var annotations = [];
      $scope.chatLines = [];

      // get current code from aceEditor
      var inputCode = aceEditor
        .getSession()
        .getValue()
        .replace(/ +/g, ' ')
        .replace(/\s*\;\s*$/g, ';')
        .split('\n');

      var result = CodingAssistantCodeMatchSrv.getMatchedExplanations(db, inputCode, aceEditor, colors);

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
            // store a new annotation with the error lineLevel in the annotations array
            annotations.push({
              row: chatline.lineLevel - 1,
              column: 0,
              text: chatline.message,
              type: 'error',
            });
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
        // display all the annotations in the aceEditor
        aceEditor.getSession().setAnnotations(annotations);
      });

      // Update showNoCodeMessage element based on combinedExplanations array length
      $scope.showNoCodeMessage = result.explanations.length === 0;
    }

    // call mouseclick listener in ace service
    AceEditorSrv.mouseDownListener(aceEditor, function (e) {
      $scope.cursorPosition = e.getDocumentPosition().row + 1;
      highlightChatbox($scope.cursorPosition);
      $scope.$apply();
    });

    // function which highlights the corresponding chatbox when clicking into line / opening explanation tab
    function highlightChatbox(cursorPosition) {
      var chatBoxId = 'chatLine-' + cursorPosition;
      // get corresponding chatbox
      var chatBox = $document[0].getElementById(chatBoxId);
      // check if the chat line with the corresponding line level exists
      if (chatBox) {
        // scroll the chatbox to the associated line in the codeEditor
        chatBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    // call enterKey listener in ace service
    AceEditorSrv.enterKeyListener(aceEditor, function (e) {
      // Check if the key pressed is 'Enter'
      if (e.key === 'Enter' || e.keyCode === 13) {
        $scope.cursorPosition = -1;
        $scope.$apply();
      }
    });
  },
]);
