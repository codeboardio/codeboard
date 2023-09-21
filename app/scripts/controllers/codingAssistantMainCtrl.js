/**
 * This is the main controller for the navBarTab "explanation" - the controller will generate the explanation/error chatboxes (functionality for variable Scope and syntax-checker is in ide.js)
 *
 *
 * @author Samuel Truniger
 * @date 20.03.2023
 */
'use strict';
angular.module('codeboardApp').controller('CodingAssistantMainCtrl', [
  '$scope',
  '$rootScope',
  '$timeout',
  '$document',
  'ProjectFactory',
  'CodingAssistantCodeMatchSrv',
  'AceEditorSrv',
  'CodeboardSrv',
  function ($scope, $rootScope, $timeout, $document, ProjectFactory, CodingAssistantCodeMatchSrv, AceEditorSrv, CodeboardSrv) {
    var aceEditor = $scope.ace.editor;
    var errorLine;
    var currentLine;
    var startCode = 0;
    var chatBoxes = [];
    var disabledActions = CodeboardSrv.getDisabledActions();
    var enabledActions = CodeboardSrv.getEnabledActions();
    $scope.chatLines = [];
    $scope.cursorPosition = -1;

    // fetch db data from CodingAssistantCodeMatchSrv
    function fetchData() {
      return CodingAssistantCodeMatchSrv.getJsonData()
        .then((db) => {
          return { db };
        })
        .catch((error) => {
          console.error('An error occurred while fetching data:', error);
        });
    }

    fetchData().then(({ db }) => {
      // call updateExplanations() once to show message, when no file is opened / load initial code
      updateExplanations(db);

      // call updateExplanations when the user open the explanations tab
      $rootScope.$on('tabClicked', function () {
        var lSelectedNode = CodeboardSrv.getFile() || '.java';
        if (lSelectedNode.match(/.java/)) {
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

          updateExplanations(db);

          $timeout(() => {
            highlightChatbox(startCode);
          });
        }
      });

      // call updateExplanations() with a slight delay to ensure the initial code is loaded - click file in tree-view case
      $scope.$on('fileOpened', function () {
        $timeout(() => {
          updateExplanations(db);
        });
      });

      // Call updateExplanations() with a slight delay to ensure the initial code is loaded (click tab above editor case)
      $scope.$on('javaClassClicked', function () {
        $timeout(() => {
          updateExplanations(db);
        });
      });

      // call change listener in ace service
      AceEditorSrv.aceChangeListener(aceEditor, function () {
        var lSelectedNode = CodeboardSrv.getFile() || '.java';
        if (lSelectedNode.match(/.java/)) {
          // automatically call $apply if necessarry to prevent '$apply already in progress' error
          $timeout(() => {
            updateExplanations(db);
          });
        }
      });
    });

    // Automatic function executed one time at the beginning / when a file is openend and then every time the code in the editor changes
    function updateExplanations(db) {
      chatBoxes = [];

      // get current code from aceEditor
      var inputCode = AceEditorSrv.getInputCode(aceEditor);

      var explanations = CodingAssistantCodeMatchSrv.getMatchedExplanations(db, inputCode, aceEditor).explanations;

      // Iterate through the explanations array to generate the chatboxes
      explanations.forEach((explanation) => {
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
            if (!disabledActions.includes('error-chatbox') || enabledActions.includes('error-chatbox')) {
              chatBoxes.push(chatline);
            }
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
          chatBoxes.push(chatline);
        }
      });

      const newChatLines = [];
      for (let i = 0; i < chatBoxes.length; i++) {
        const newChatBox = chatBoxes[i];
        // check if the newChatbox is already inside the $scope.chatLines array
        const existChatBoxIndex = $scope.chatLines.findIndex((chatline) => chatline.lineLevel === newChatBox.lineLevel);

        // if the chatbox does not exist add it to newChatLines array
        if (existChatBoxIndex === -1) {
          newChatLines.push(newChatBox);
        } else {
          // if the chatbox exist and is of type error do further checks
          if ($scope.chatLines[existChatBoxIndex].type === 'error' && newChatBox.lineLevel === $scope.chatLines[existChatBoxIndex].lineLevel) {
            const oldErrorChatLine = $scope.chatLines[existChatBoxIndex].message;
            const newErrorChatLine = newChatBox.message;

            // check if new chatbox has not the same message as the existing error chatbox --> if so update the chatboxes
            if (oldErrorChatLine !== newErrorChatLine) {
              newChatLines.push(newChatBox);
            } else {
              // keep the existing error chatbox
              newChatLines.push($scope.chatLines[existChatBoxIndex]);
            }
          }
          // if the chatbox exist and is of type exlanation do further checks
          else if ($scope.chatLines[existChatBoxIndex].type === 'explanation' && newChatBox.lineLevel === $scope.chatLines[existChatBoxIndex].lineLevel) {
            const oldExplanationChatLine = $scope.chatLines[existChatBoxIndex].message;
            const newExplanationChatLine = newChatBox.message;

            // check if new chatbox has not the same message as the existing explanation chatbox --> if so update the chatboxes
            if (oldExplanationChatLine !== newExplanationChatLine) {
              newChatLines.push(newChatBox);
            } else {
              // keep the existing explanaiton chatbox
              newChatLines.push($scope.chatLines[existChatBoxIndex]);
            }
          }
        }
      }

      $scope.chatLines = newChatLines;

      // checks if every chatBox in $scope.chatLines array is in chatBoxes array --> if not, correct chatbox gets removed from $scope.chatLines array
      for (let i = $scope.chatLines.length - 1; i >= 0; i--) {
        const chatline = $scope.chatLines[i];
        if (!chatBoxes.some((c) => c.lineLevel === chatline.lineLevel)) {
          $scope.chatLines.splice(i, 1);
        }
      }

      // Update showNoCodeMessage element based on combinedExplanations array length
      $scope.showNoCodeMessage = explanations.length === 0;
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
