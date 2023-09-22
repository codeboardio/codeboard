/**
 * Responsible for fetching data from db_codingassistant dir, matching lines (ace-editor) with regex, generating explanations,
 * handling line change events and generate styles for variable scope blocks.
 *
 * @author Samuel Truniger
 */

'use strict';

angular.module('codeboardApp').service('CodingAssistantCodeMatchSrv', [
  '$http',
  function ($http) {
    var service = this;
    var Range = ace.require('ace/range').Range;

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Fetching data
    // fetch the json data from "explanations.json"
    service.getJsonData = function () {
      return $http.get('./staticfiles/explanations.json').then(
        function (response) {
          return response.data;
        },
        function (error) {
          console.error('Error fetching JSON data:', error);
        }
      );
    };

    // colors for variable scope
    var colors = [
      '#FFE15D',
      '#9A86A4',
      '#C47AFF',
      '#3A8891',
      '#FFA8A8',
      '#40DFEF',
      '#DC3535',
      '#CCFF00',
      '#00FFFF',
      '#A50A50',
      '#13678A',
      '#F4722B',
      '#EC4EC4',
      '#7FBBB3',
      '#D1C492',
      '#c0f5a9',
      '#f5bc0c',
      '#cfe2f3',
      '#f4cccc',
      '#ead1dc',
      '#d385e4',
      '#51b9d4',
      '#8b788b',
      '#54f8c2',
      '#ac337b',
      '#8a132e',
      '#e529a9',
      '#5e72bf',
      '#5f91c5',
      '#5f985a',
      '#F08080',
      '#FA8072',
      '#E9967A',
      '#FFC0CB',
      '#FFA8A8',
      '#FFB6C1',
      '#FF7F50',
      '#FFFFE0',
      '#FFFACD',
      '#FAFAD2',
      '#FFEFD5',
      '#FFE4B5',
      '#FFDAB9',
      '#EEE8AA',
      '#F0E68C',
      '#BDB76B',
      '#E6E6FA',
      '#D8BFD8',
      '#DDA0DD',
      '#E0FFFF',
      '#AFEEEE',
      '#B0C4DE',
      '#B0E0E6',
      '#ADD8E6',
      '#87CEEB',
      '#FFF8DC',
      '#FFEBCD',
      '#FFE4C4',
      '#FFDEAD',
      '#F5DEB3',
      '#DEB887',
    ];

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Everything related to toggle markers - code implemented with help form stack overflow (https://stackoverflow.com/questions/65677814/how-to-remove-all-the-existing-highlight-markers-in-ace-editor-using-react) and Chat-GPT
    // Indicates if markers are toggled on or off
    var toggled = false;
    service.storedMarkersBackup = [];
    // does line match
    var markerMatch;
    var dataType;
    var numWhitespaces;
    var variableName;
    var startIndex;
    var variableLength;
    var wholeLineTxt;
    // regex to calculate marker position
    const markerDeclarationRegex = /(?<=\s|^)((?:\w+)(?:\s*\[\])+|\w+)(\s+)(\w+)/;
    const markerRedeclarationRegex = /(?<=\s|^)(\w+)(?=\s*[+\-*\/]?=|\+\+;|--;|\[\d+\])/;
    const markerLoopRegex = /(?:for|while)\s*\(([^()]*?)(\w+)\s+([^()]*?)(\w+)/;

    // toggles the markers on and off in the code-editor
    service.toggleMarkers = function (aceEditor, changed, newTabOpened) {
      toggled = !toggled;
      if (newTabOpened === undefined) {
        newTabOpened = false;
      }
      if (toggled && !changed) {
        // if storedMarkers is empty, try adding from storedMarkersBackup (this case gets executed when the code in the editor does not change and the variable scope window gets toggled on/off)
        if (service.storedMarkers.length === 0 && service.storedMarkersBackup) {
          service.storedMarkersBackup.forEach((item) => {
            if (item.clazz.includes('marker')) {
              aceEditor.getSession().addMarker(item.range, item.clazz, item.type);
            }
          });
        } 
        // this condition gets executed when the markers get showed the first time.. if there are now changes in the code the markers get showed from the storedMarkersBackup array
        else {
          // show the stored markers in the code-editor
          service.storedMarkers.forEach((item) => {
            if (item.clazz.includes('marker')) {
              // store marker id for later removal
              item.markerId = aceEditor.getSession().addMarker(item.range, item.clazz, item.type);
            }
          });
          // update storedMarkersBackup when storedMarkers are shown
          service.storedMarkersBackup = [...service.storedMarkers];
          service.storedMarkers = [];
        }
      } else if ((!toggled && !changed) || changed || newTabOpened) {
        if (newTabOpened) {
          toggled = false;
        }
        // remove existing markers in the ace Editor
        var existMarkers = aceEditor.getSession().getMarkers();
        if (existMarkers) {
          var prevMarkersArr = Object.keys(existMarkers);
          prevMarkersArr.forEach((item) => {
            aceEditor.getSession().removeMarker(existMarkers[item].id);
          });
        }
      }
    };

    // add markers dynamically when button is toggled on
    // service.addDynamicMarkers = function (aceEditor) {
    //     if (toggled) {
    //         storedMarkers.forEach((item) => {
    //             if (item.clazz.includes('marker')) {
    //                 aceEditor.session.addMarker(item.range, item.clazz, item.type);
    //             }
    //             storedMarkers = [];
    //         });
    //     }
    // };

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // CODE MATCH AND VARIABLE SCOPE LOGIC

    /**
     * Process the data and return matched explanations
     * @param {Array} data the content from the explanations.json
     * @param {Array} inputCodeArray the current code in the Code-Editor
     * @param {} aceEditor the aceEditor
     */
    service.getMatchedExplanations = function (data, inputCodeArray, aceEditor) {
      // Regexes needed for further check
      const beforeRegex = /^(public|private|protected)/;
      const staticRegex = /.* static/;
      const paraRegex = /(int|String|boolean|long|double|char)[\[\]]*\s*(\w+[\[\]]*)+/;
      const newVarComparisationRegex = /^\s*((?:boolean))\s*(\w+)\s*\=\s*([A-z0-9$_()+\-*\/%\s]+)\s+([<=!>]+)\s+([A-z0-9$_()\-+*\/%\s]+);\s*$/;
      const redeclareVarComparisationRegex = /^\s*(\w+)\s+\=\s+([A-z0-9$_.()*\-+/%\s*]+)\s+([<=!>]+)\s+([A-z0-9$_.()*\-+/%\s*]+);\s*$/;

      // store the markers - reset array after every function call
      service.storedMarkers = [];

      // check line height from codeEditor
      var editorLineHeight;
      editorLineHeight = aceEditor.renderer.lineHeight;

      // array to store part of explanations to combine them at the end
      var explanationParts = [];
      // variable to append a new explanation to existing one
      var lastLineIndex = -1;
      // array to store explanations, row-numbers, links and explanation type
      var explanations = [];

      // variable to check if code is intended
      var level = 0;
      var braceLevel = 0;
      // variable to check if something a comment
      var isComment = false;
      // variable to check if something a multi-line comment
      var stayComment = false;
      // Map to store new declared variables
      var variableMap = new Map();
      // Map for Scanner and Random
      var importMap = new Map();
      // count new declared variables
      var variableCount = 0;
      // the rows in the ace-editor
      var linelevel = 0;

      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      // Loop trough every line of code (from Code-Editor)
      inputCodeArray.forEach(function (line) {
        var matched = false;
        // used for variables declaration errors
        var declareVarErr = false;
        // used for variables redeclaration errors
        var redeclareVarErr = false;

        // with every line of code/no code the linelevel increments by 1
        linelevel++;

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Check if code-line is a comment
        if (line.match(/\/\//) || line.match(/\/\*/)) {
          isComment = true;
          if (line.match(/\/\*/)) {
            stayComment = true;
          }
        } else if (isComment == true && stayComment == false) {
          isComment = false;
        }
        if (stayComment == true && line.match(/\*\//)) {
          isComment = true;
          stayComment = false;
        }

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Check if public, private or protected is used
        if (line.match(beforeRegex)) {
          var currentRegex2 = line.match(beforeRegex);
          var before = true;
        }

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Loop trough all the regex from "line" over the Code from Code-Editor
        data.lines.forEach(function (dbline) {
          if (line.match(dbline.regex) && matched == false && isComment == false) {
            // matched == false to not go over it again once it matched
            matched = true;
            // loops over all "lines"-objects from the json file
            // checks if the regex are the same to make sure its the right object in json => now we can use all the strings from the json file

            // capture groups are saved in currentMatch
            const currentMatch = line.match(dbline.regex);
            // splits explanations form json by ' and store them in answerArray[] to get capture groups
            var answerArray = dbline.answer.split("'");

            // SCANNER AND RANDOM
            if (dbline.name === 'newScannerRegex' || dbline.name === 'newRandomRegex') {
              if (importMap.has(currentMatch[2])) {
                matched = false;
              } else {
                importMap.set(currentMatch[2], currentMatch[1]);
              }
            }

            // METHOD CREATION (explanation for static/not static, >=1 inputParameter)
            if (dbline.name === 'methodRegex' || dbline.name === 'methodVoidRegex') {
              // Check if static
              if (line.match(staticRegex)) {
                // add "Die statische" to the beginning of the array
                answerArray.unshift('Die statische ');
              } else {
                // add "Die " to the beginning of the array
                answerArray.unshift('Die ');
              }
              // check if parameter
              if (currentMatch[3].match(paraRegex)) {
                // split parameter
                var currentMatchPara = currentMatch[3].split(',');
                var currentRegexPara = [];
                currentMatchPara.forEach(function (para) {
                  // match for each split
                  var match = para.match(paraRegex);
                  // Ensure that the match is not null
                  if (match) {
                    currentRegexPara.push(match);
                  }
                });
                // if only one parameter
                if (currentRegexPara.length == 1) {
                  answerArray.push(' mit dem Parameter "' + currentRegexPara[0][0] + '"');
                }
                // if 1+ parameter
                else if (currentRegexPara.length > 1) {
                  answerArray.push(' mit den Parametern');
                  for (let i = 0; i < currentRegexPara.length; i++) {
                    if (i == currentRegexPara.length - 1) {
                      answerArray.push(' "' + currentRegexPara[i][0] + '"');
                    } else {
                      answerArray.push(' "' + currentRegexPara[i][0] + '",');
                    }
                  }
                }
              }
            }

            // METHOD CALL
            if (dbline.name === 'callMethodNoInputRegex' || dbline.name === 'callMethodInputRegex') {
              // loops through all the splitted answers
              for (let j = 0; j < answerArray.length; j++) {
                // checks if output out of the captured groups from the regex is needed
                if (answerArray[j].match(/^1$/)) {
                  // store position on which regex is stored in database.json
                  const currentNumber = answerArray[j].match(/^1$/);
                  // stores the text from "answer" in database.json
                  explanationParts.push(currentMatch[currentNumber]);
                } else {
                  // gets output from answer field in json
                  explanationParts.push(answerArray[j]);
                }
              }

              // add parameters to explanation if code match "callMethodInputRegex"
              if (dbline.name === 'callMethodInputRegex') {
                let inputPara = currentMatch[2].split(',');
                if (inputPara.length == 1) {
                  explanationParts.push(' mit dem Parameter "' + inputPara[0] + '"');
                } else if (inputPara.length > 1) {
                  explanationParts.push(' mit den Parametern "');
                  for (let j = 0; j < inputPara.length; j++) {
                    if (j == inputPara.length - 1) {
                      explanationParts.push(inputPara[j] + '"');
                    } else {
                      explanationParts.push(inputPara[j] + ', ');
                    }
                  }
                }
              }
              explanationParts.push(' aufgerufen');
            }
            // check all the other objects in "lines" in json-file
            else {
              // loops through all the splitted answers
              for (let j = 0; j < answerArray.length; j++) {
                // checks if output out of the captured groups from the regex is needed
                if (answerArray[j].match(/^[0-9]*$/)) {
                  const currentNumber = answerArray[j].match(/^[0-9]*$/);
                  explanationParts.push(currentMatch[currentNumber]);
                } else {
                  // gets output from answer field in json
                  if (j + 1 == answerArray.length && before == true) {
                    // adds "public" or "private" to description
                    if (answerArray[j].match(/<\/div>/)) {
                      answerArray[j] = answerArray[j].replaceAll('</div>', '');
                    }
                    explanationParts.push(answerArray[j] + ' und ist ' + currentRegex2[1]);
                  } else {
                    // just adds answer text
                    explanationParts.push(answerArray[j]);
                  }
                }
              }
            }
            // add explanations to explanations array
            explanations.push({
              answer: explanationParts.join(''),
              link: dbline.link,
              lineLevel: linelevel,
              isError: false,
              code: line,
            });

            // Store the index of the last explanation for the current line (is needed e.g. for explaining a condition)
            lastLineIndex = explanations.length - 1;
            // reset the explanationParts array for the next line
            explanationParts = [];

            if (dbline.block == 'true') {
              level += 1;
              if (line.match(/}\s*(else\s*if\s*\([^)]*\)|else)\s*{/)) {
                level -= 1;
              }
            }
          }
        });

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Check if explaining a condition is needed (things inside ())
        data.notCheckedLines.forEach(function (dbline) {
          // loops the code from code-editor over the notchecked objets from the json file
          if (line.match(dbline.regex) && isComment == false) {
            // checks if the line matches this regex
            var condition = line.match(dbline.regex);
            var update;
            // expression for foor-loop
            if (dbline.name == 'expressionforRegex') {
              if (condition[2].match(/;/)) {
                // stores the capture groups in condition
                var newCondition = condition[2].split(';');
                update = newCondition[2];
                condition[2] = newCondition[1];
                if (newCondition[0].match(/(int|double)\s(\w+)\s?\=\s?[0-9]+/)) {
                  // calculate Margin & convert to string
                  var margin = '' + (linelevel - 1) * editorLineHeight;
                  margin += 'px';
                  // create object with linelevel at the start, linelevel at the end, blocklevel, margin, color, keyoutput, height
                  var variableObject = { lineLevelStart: linelevel, blockLevel: level, lineLevelEnd: 0, height: '', margin: margin, color: colors[variableCount] };
                  var startwertMatch = newCondition[0].match(/(int|double)\s(\w+)\s?\=\s?[0-9]+/);
                  variableMap.set(startwertMatch[2], variableObject);

                  /////////////////// Ace Marker ///////////////////
                  // get the code from the current line
                  wholeLineTxt = aceEditor.session.getLine(linelevel - 1);
                  markerMatch = wholeLineTxt.match(markerLoopRegex);
                  if (markerMatch) {
                    dataType = markerMatch[3];
                    variableName = markerMatch[4];
                    startIndex = markerMatch.index + markerMatch[0].length - dataType.length - variableName.length;
                    variableLength = variableName.length;

                    service.storedMarkers.push({
                      range: new Range(linelevel - 1, startIndex, linelevel - 1, startIndex + variableLength),
                      clazz: 'marker' + variableName,
                      type: 'text',
                    });
                  }
                  variableCount++;

                  explanationParts.push(' mit Startwert ' + newCondition[0] + '; ');
                }
              }
            }
            // splits the things inside the () of a expression
            var conditionArr = condition[2].split(' ');
            // solange oder falls
            explanationParts.push(' ' + dbline.answer + ' ');
            // loops through words of expression
            for (let i = 0; i < conditionArr.length; i++) {
              var matchedExpression = false;
              // loops over all regex in "expressions" in json-file
              data.expressions.forEach(function (currentExpression) {
                if (conditionArr[i].match(currentExpression.regex)) {
                  // loops over all expression objects from the json file

                  // input not needed (fe: == gets replaced)
                  explanationParts.push(currentExpression.answer + ' ');
                  // checks if explanationParts contains a cg1 to replace it with the correct cg
                  if (explanationParts.some((cg) => cg.match(/cg1/))) {
                    const currentMatch = conditionArr[i].match(currentExpression.regex);
                    // replace capturegroup 1 (cg1) with the captured content
                    explanationParts = explanationParts.map((cg) => cg.replaceAll('cg1', currentMatch[1]));
                    // checks if explanationParts contains a cg2 to replace it with the correct cg
                    if (explanationParts.some((cg) => cg.match(/cg2/))) {
                      // replace capturegroup 2 (cg2) with the captured content
                      explanationParts = explanationParts.map((cg) => cg.replaceAll('cg2', currentMatch[2]));
                    }
                  }
                  matchedExpression = true;
                }
              });

              if (matchedExpression == false) {
                explanationParts.push(conditionArr[i] + ' ');
              }
            }
            if (condition[2].match(/^[A-z0-9]+$/)) {
              explanationParts.push('true ist');
            } else if (condition[2].match(/^![A-z0-9]+$/)) {
              // replace the "!" with "" in explanation
              explanationParts = explanationParts.map((exp) => exp.replaceAll('!', ''));
              explanationParts.push('false ist');
            } else if (condition[2].match(/!/)) {
              // replace the "!" with "NOT" in explanation
              explanationParts = explanationParts.map((exp) => exp.replaceAll('!', 'NOT'));
            }
            if (dbline.name === 'expressionforRegex') {
              data.expressions.forEach(function (expression) {
                if (update.match(expression.regex)) {
                  var updateMatch = update.match(expression.regex);
                  explanationParts.push('; ' + expression.answer.replaceAll('cg1', updateMatch[1]));
                }
              });
            }

            // Append the new explanation to the existing one
            explanations[lastLineIndex].answer += ' ' + explanationParts.join('');

            // reset the explanationParts array for the next line
            explanationParts = [];
          }
        });

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Check if it is a Print-Statement (standard explanations ("wird auf der Konsole ausgegeben"))
        data.print.forEach(function (dbline) {
          // check if print statement
          if (line.match(dbline.regex) && matched == false && isComment == false) {
            // capture groups in neuer variabel speichern
            var currentMatch = line.match(dbline.regex);
            // antwort spliten und in neuem array speichern
            var printAnswerArray = dbline.answer.split("'");
            // matched true setzen um nicht als "nicht erkannt" klassifiziert zu werden
            matched = true;
            var matchedPrintExpression = false;

            // store print statement in new variable "printStatement"
            var printStatement = currentMatch[1];
            var checkPrintStatement;
            if (printStatement == '') {
              for (let j = 0; j < printAnswerArray.length; j++) {
                // add "printAnswerArray" to explanationParts array
                explanationParts.push(printAnswerArray[j] + ' ');
              }
            } else {
              // initialize "anserArray"
              var answerArray;
              // loop trough all printExpressions (used for things inside ())
              data.printExpressions.forEach(function (currentExpression) {
                // check if printExpression gets matched
                if (printStatement.match(currentExpression.regex) && matchedPrintExpression == false) {
                  matchedPrintExpression = true;
                  // split answer of the printExpressions and store it in the printExpressionAnswerArray
                  var printExpressionAnswerArray = currentExpression.answer.split("'");
                  // store capture groups in a new array
                  checkPrintStatement = printStatement.match(currentExpression.regex);
                  for (let j = 0; j < printExpressionAnswerArray.length; j++) {
                    // go trough all the splitted answers and check where the cg is needed
                    if (printExpressionAnswerArray[j].match(/^[0-9]*$/)) {
                      const currentNumber = printExpressionAnswerArray[j].match(/^[0-9]*$/);
                      printExpressionAnswerArray[j] = checkPrintStatement[currentNumber];
                    }
                  }
                  if (currentExpression.name === 'callMethodInputRegex') {
                    let inputPara = checkPrintStatement[2].split(',');
                    if (inputPara.length == 1) {
                      printExpressionAnswerArray.splice(2, 0, ' mit dem Parameter "' + inputPara[0] + '"');
                    } else if (inputPara.length > 1) {
                      let callMethod = ' mit den Parametern "';
                      for (let j = 0; j < inputPara.length; j++) {
                        if (j == inputPara.length - 1) {
                          callMethod += inputPara[j] + '"';
                        } else {
                          callMethod += inputPara[j] + ', ';
                        }
                      }
                      printExpressionAnswerArray.splice(2, 0, callMethod);
                    }
                  }
                  answerArray = printExpressionAnswerArray.concat(printAnswerArray);
                }
              });
              for (let j = 0; j < answerArray.length; j++) {
                // add answerArray to explanationParts
                explanationParts.push(answerArray[j] + ' ');
              }
            }
            // add explanations to explanations array
            explanations.push({
              answer: explanationParts.join(''),
              link: dbline.link,
              lineLevel: linelevel,
              isError: false,
              code: line,
            });

            // reset the explanationParts array for the next line
            explanationParts = [];
          }
        });

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////7
        // Variables Scope
        data.varScope.forEach(function (dbline) {
          // check if new Variable
          if (line.match(dbline.regex) && matched == false && isComment == false) {
            // store cg in a new variable
            var currentMatch = line.match(dbline.regex);
            // split answer and store in new array
            var varScopeAnswerArray = dbline.answer.split("'");

            //check if variableName starts with a number or sc else --> highlight it as error
            if (currentMatch[2].match(/^[0-9_.&$"!*+'#]+/)) {
              matched = false;
              declareVarErr = true;
            } else {
              var wrongRandomScanner = false;
              var randomScannerMatch = false;
              if (dbline.name === 'randomOrScannerRegex') {
                //console.log(currentMatch);
                if (importMap.has(currentMatch[3])) {
                  if (importMap.get(currentMatch[3]) === 'Random') {
                    data.randomExpressions.forEach(function (rnExpression) {
                      if (currentMatch[0].match(rnExpression.regex)) {
                        varScopeAnswerArray = rnExpression.answer.split("'");
                        randomScannerMatch = true;
                        dbline.link = 'https://www.javatpoint.com/how-to-generate-random-number-in-java';
                      }
                    });
                  } else if (importMap.get(currentMatch[3]) === 'Scanner') {
                    data.scannerExpressions.forEach(function (ksExpression) {
                      if (currentMatch[0].match(ksExpression.regex)) {
                        varScopeAnswerArray = ksExpression.answer.split("'");
                        randomScannerMatch = true;
                        dbline.link = 'https://www.w3schools.com/java/java_user_input.asp';
                      }
                    });
                  }
                }
                if (randomScannerMatch == false) {
                  wrongRandomScanner = true;
                }
              }
              // check if variable is not already declared
              if (variableMap.has(currentMatch[2]) == false && wrongRandomScanner == false) {
                // set matched on true to not get recognize as not identify
                matched = true;
                // calculate Margin & convert to string
                var margin = '' + (linelevel - 1) * editorLineHeight;
                // add pixel
                margin += 'px';
                // create object with linelevel at the start, linelevel at the end, blocklevel, margin, color, keyoutput, height
                var variableObject = { lineLevelStart: linelevel, blockLevel: level, lineLevelEnd: 0, height: '', margin: margin, color: colors[variableCount] };
                // add object to variable map with variable name as key
                variableMap.set(currentMatch[2], variableObject);

                /////////////////// Ace Marker ///////////////////
                // get the code from the current line
                wholeLineTxt = aceEditor.session.getLine(linelevel - 1);
                markerMatch = wholeLineTxt.match(markerDeclarationRegex);
                if (markerMatch) {
                  dataType = markerMatch[1];
                  numWhitespaces = markerMatch[2].length;
                  variableName = markerMatch[3];
                  startIndex = markerMatch.index + dataType.length + numWhitespaces;
                  variableLength = variableName.length;

                  service.storedMarkers.push({
                    range: new Range(linelevel - 1, startIndex, linelevel - 1, startIndex + variableLength),
                    clazz: 'marker' + variableName,
                    type: 'text',
                  });
                }

                // increase variableCount -> different color & outputid for every variable
                variableCount++;

                if (dbline.name === 'newVarCallMethodRegex') {
                  if (currentMatch[4] !== '') {
                    let inputPara = currentMatch[4].split(',');
                    if (inputPara.length == 1) {
                      varScopeAnswerArray.splice(2, 0, '" mit dem Parameter "' + inputPara[0]);
                    } else if (inputPara.length > 1) {
                      let callMethod = '" mit den Parametern "';
                      for (let j = 0; j < inputPara.length; j++) {
                        if (j == inputPara.length - 1) {
                          callMethod += inputPara[j];
                        } else {
                          callMethod += inputPara[j] + ', ';
                        }
                      }
                      varScopeAnswerArray.splice(2, 0, callMethod);
                    }
                  }
                }
                for (let j = 0; j < varScopeAnswerArray.length; j++) {
                  // loops through all the splitted answers
                  if (varScopeAnswerArray[j].match(/^[0-9]*$/)) {
                    // checks if output out of the captured groups from the regex is needed (with position on which regex is stored in database.json)
                    const currentNumber = varScopeAnswerArray[j].match(/^[0-9]*$/);
                    // stores the text from "answer" in database.json to the explanationParts array
                    explanationParts.push(currentMatch[currentNumber]);
                  } else {
                    // get "answer" in json-file & just adds answer text
                    explanationParts.push(varScopeAnswerArray[j]);
                  }
                }
                // checks if inputtext is a declare boolean text
                if (line.match(newVarComparisationRegex)) {
                  var answerArray;
                  // loops through expressions to get the correct cg
                  data.expressions.forEach(function (currentExpression) {
                    if (currentMatch[4].match(currentExpression.regex)) {
                      answerArray = currentExpression.answer;
                      // replace word expr in database.json with the correct value
                      explanationParts = explanationParts.map((expr) => expr.replaceAll('expr', answerArray));
                    }
                  });
                }

                if (dbline.name === 'newVariableBitOperationRegex') {
                  var bitOpExprAnswerArray;
                  // loops over all expression objects from the json file
                  data.bitOperationExpression.forEach(function (currentExpression) {
                    if (currentMatch[4].match(currentExpression.regex)) {
                      // split answer of print expression and stroe it in bitOpExprAnswerArray
                      bitOpExprAnswerArray = currentExpression.answer;
                      explanationParts = explanationParts.map((op) => op.replaceAll('operation', bitOpExprAnswerArray));
                    }
                  });
                }

                if (dbline.name === 'newVariableLogicOperatorRegex') {
                  var LogicOpExprAnswerArray;
                  // loops over all expression objects from the json file
                  data.logicOperatorExpressions.forEach(function (currentExpression) {
                    if (currentMatch[4].match(currentExpression.regex)) {
                      // split answer of print expression and store it in LogicOpExprAnswerArray
                      LogicOpExprAnswerArray = currentExpression.answer;
                      explanationParts = explanationParts.map((logic) => logic.replaceAll('logic', LogicOpExprAnswerArray));
                    }
                  });
                }

                if (dbline.name === 'newVariableLogicOperatorNOTRegex') {
                  var LogicOpNOTExprAnswerArray;
                  // loops over all expression objects from the json file
                  data.logicOperatorExpressions.forEach(function (currentExpression) {
                    if (currentMatch[3].match(currentExpression.regex)) {
                      // split answer of print expression and store it in LogicOpNOTExprAnswerArray
                      LogicOpNOTExprAnswerArray = currentExpression.answer;
                      explanationParts = explanationParts.map((logic) => logic.replaceAll('logic', LogicOpNOTExprAnswerArray));
                    }
                  });
                }

                // add explanations to explanations array
                explanations.push({
                  answer: explanationParts.join(''),
                  link: dbline.link,
                  lineLevel: linelevel,
                  isError: false,
                  code: line,
                });

                // reset the explanationParts array for the next line
                explanationParts = [];
              }
              // check if variable is already declared
              else if (variableMap.has(currentMatch[2]) == true || wrongRandomScanner == true) {
                matched = false;
                declareVarErr = true;
              }
            }
          }
        });

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // start or end of the blocks

        // check for closing brace followed by else or else if (code-beautify)
        var elseIfOrElseRegex = line.match(/}\s*(else\s*if\s*\([^)]*\)|else)\s*{/);

        if (isComment != true) {
          var count = line.match(/{/g);
          if (count) {
            braceLevel += count.length;
          }
        }

        if (isComment != true) {
          var count = line.match(/}/g);
          if (count) {
            braceLevel -= count.length;
          }
        }

        // check if the current line has a closing brace
        if (count) {
          // if the closing brace is followed by else or else if
          if (elseIfOrElseRegex) {
            variableMap.forEach(function (value, key) {
              if (value.blockLevel === level && value.lineLevelEnd === 0) {
                value.lineLevelEnd = linelevel;
                var height = '' + (value.lineLevelEnd - value.lineLevelStart) * editorLineHeight;
                height += 'px';
                value.height = height;
              }
            });
          } else {
            // if the closing brace is not followed by else or else if
            if (level - braceLevel === 1) {
              variableMap.forEach(function (value, key) {
                if (value.blockLevel === level && value.lineLevelEnd === 0) {
                  value.lineLevelEnd = linelevel;
                  var height = '' + (value.lineLevelEnd - value.lineLevelStart) * editorLineHeight;
                  height += 'px';
                  value.height = height;
                }
              });
              level -= 1;
            }
          }
        }

        // loops over all variables in map to display variable scope blocks for variables which are not in {}
        variableMap.forEach(function (value, key) {
          // checks if current variable has the blocklevel = 0
          if (value.blockLevel == 0) {
            // actual linelevel is assigned to linelevelend of current variable
            value.lineLevelEnd = linelevel;
            // calculate height and convert to string
            var height = '' + (value.lineLevelEnd - value.lineLevelStart + 1) * editorLineHeight;
            // add px (pixel) to height
            height += 'px';
            // height is assigned to height of current variable
            value.height = height;
          }
        });

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////7
        // Variables redeclaration
        data.redeclareVar.forEach(function (dbline) {
          if (line.match(dbline.regex) && matched === false && isComment === false) {
            // check if new Variable & store cg in a new variable
            var currentMatch = line.match(dbline.regex);
            // split answer and store in new array
            var redeclarVarAnswerArray = dbline.answer.split("'");
            var wrongRandomScanner = false;
            var randomScannerMatch = false;
            if (dbline.name === 'randomOrScannerRegex') {
              if (importMap.has(currentMatch[2])) {
                if (importMap.get(currentMatch[2]) === 'Random') {
                  data.randomExpressions.forEach(function (rnExpression) {
                    if (currentMatch[0].match(rnExpression.regex)) {
                      redeclarVarAnswerArray = rnExpression.answer.split("'");
                      randomScannerMatch = true;
                      dbline.link = 'https://www.javatpoint.com/how-to-generate-random-number-in-java';
                    }
                  });
                } else if (importMap.get(currentMatch[2]) === 'Scanner') {
                  data.scannerExpressions.forEach(function (ksExpression) {
                    if (currentMatch[0].match(ksExpression.regex)) {
                      redeclarVarAnswerArray = ksExpression.answer.split("'");
                      randomScannerMatch = true;
                      dbline.link = 'https://www.w3schools.com/java/java_user_input.asp';
                    }
                  });
                }
              }
              if (randomScannerMatch == false) {
                wrongRandomScanner = true;
              }
            }
            if (variableMap.has(currentMatch[1]) && wrongRandomScanner == false) {
              // checks if variable redeclaration comes after variable declaration and inside the scope
              if (linelevel == variableMap.get(currentMatch[1]).lineLevelEnd && variableMap.get(currentMatch[1]).blockLevel == 0) {
                matched = true;
              }
              // checks if variable redeclaration comes after variable declaration and inside the scope
              else if (variableMap.get(currentMatch[1]).blockLevel <= level && variableMap.get(currentMatch[1]).lineLevelEnd == 0) {
                matched = true;
              }
              // if variable is in variableMap but redeclared outside scope (matched = false)
              else {
                matched = false;
                redeclareVarErr = true;
              }
            }
            // if variable is not inside variableMap it must be declared first (matched = false)
            else {
              // another boolean variable could be used to make another explanation
              matched = false;
              redeclareVarErr = true;
            }

            if (matched == true) {
              /////////////////// Ace Marker ///////////////////
              // get the code from the current line
              wholeLineTxt = aceEditor.session.getLine(linelevel - 1);
              markerMatch = wholeLineTxt.match(markerRedeclarationRegex);
              if (markerMatch) {
                variableName = markerMatch[1];
                startIndex = markerMatch.index;
                variableLength = variableName.length;

                service.storedMarkers.push({
                  range: new Range(linelevel - 1, startIndex, linelevel - 1, startIndex + variableLength),
                  clazz: 'marker' + variableName,
                  type: 'text',
                });
              }

              if (dbline.name === 'redeclareVariableCallMethodRegex') {
                if (currentMatch[3] !== '') {
                  let inputPara = currentMatch[3].split(',');
                  if (inputPara.length == 1) {
                    redeclarVarAnswerArray.splice(2, 0, '" mit dem Parameter "' + inputPara[0]);
                  } else if (inputPara.length > 1) {
                    let callMethod = '" mit den Parametern "';
                    for (let j = 0; j < inputPara.length; j++) {
                      if (j == inputPara.length - 1) {
                        callMethod += inputPara[j];
                      } else {
                        callMethod += inputPara[j] + ', ';
                      }
                    }
                    redeclarVarAnswerArray.splice(2, 0, callMethod);
                  }
                }
              }
              for (let j = 0; j < redeclarVarAnswerArray.length; j++) {
                // loops through all the splitted answers
                if (redeclarVarAnswerArray[j].match(/^[0-9]*$/)) {
                  // checks if output out of the captured groups from the regex is needed (with position on which regex is stored in database.json)
                  const currentNumber = redeclarVarAnswerArray[j].match(/^[0-9]*$/);
                  // stores the text from "answer" in explanations.json in explanationParts
                  explanationParts.push(currentMatch[currentNumber]);
                } else {
                  // get "answer" in json-file and just adds answer text
                  explanationParts.push(redeclarVarAnswerArray[j]);
                }
              }
              if (line.match(redeclareVarComparisationRegex)) {
                // checks if inputtext is a redeclare boolean text --> loops through expressions to get the correct cg
                var answerArray;
                data.expressions.forEach(function (currentExpression) {
                  if (currentMatch[3].match(currentExpression.regex)) {
                    answerArray = currentExpression.answer;
                  }
                });
                // replace word expr in explanations.json with the correct value
                explanationParts = explanationParts.map((expr) => expr.replaceAll('expr', answerArray));
              }
              if (dbline.name === 'redeclareVariableBitOperationRegex') {
                var bitOpExprAnswerArray;
                data.bitOperationExpression.forEach(function (currentExpression) {
                  // loops over all expression objects from the json file
                  if (currentMatch[3].match(currentExpression.regex)) {
                    // split answer of print expression and store it in bitOpExprAnswerArray
                    bitOpExprAnswerArray = currentExpression.answer;
                    explanationParts = explanationParts.map((op) => op.replaceAll('operation', bitOpExprAnswerArray));
                  }
                });
              }

              if (dbline.name === 'redeclareVariableLogicOperatorRegex') {
                var LogicOpExprAnswerArray;
                data.logicOperatorExpressions.forEach(function (currentExpression) {
                  // loops over all expression objects from the json file
                  if (currentMatch[3].match(currentExpression.regex)) {
                    // split answer of print expression and store it in LogicOpExprAnswerArray
                    LogicOpExprAnswerArray = currentExpression.answer;
                    explanationParts = explanationParts.map((logic) => logic.replaceAll('logic', LogicOpExprAnswerArray));
                  }
                });
              }

              if (dbline.name === 'redeclareVariableLogicOperatorNOTRegex') {
                var LogicOpNOTExprAnswerArray;
                data.logicOperatorExpressions.forEach(function (currentExpression) {
                  //loops over all expression objects from the json file
                  if (currentMatch[2].match(currentExpression.regex)) {
                    // split answer of print expression and store it in LogicOpNOTExprAnswerArray
                    LogicOpNOTExprAnswerArray = currentExpression.answer;
                    explanationParts = explanationParts.map((logic) => logic.replaceAll('logic', LogicOpNOTExprAnswerArray));
                  }
                });
              }
              // add explanations to explanations array
              explanations.push({
                answer: explanationParts.join(''),
                link: dbline.link,
                lineLevel: linelevel,
                isError: false,
                code: line,
              });

              // reset the explanationParts array for the next line
              explanationParts = [];
            }
          }
        });

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Stuff that doesnt get recognized by an array from the json file & comments
        if (isComment == true) {
          matched = true;
        }
        if (matched == false) {
          if (line.match(/^(?!^\s*}\s*$)(?!^\s*\t\s*$)(?!^\s*$).+$/gm)) {
            if (redeclareVarErr) {
              explanations.push({
                answer: 'Du probierst auf eine Variable zuzugreifen, welche nocht nicht deklariert wurde, oder sich ausserhalb des Scopes befindet.',
                lineLevel: linelevel,
                isError: true,
                code: line,
              });
            } else if (declareVarErr) {
              explanations.push({
                answer: 'Diese Variable wurde bereits deklariert! Bitte verwende einen anderen Namen für die Deklaration.',
                lineLevel: linelevel,
                isError: true,
                code: line,
              });
            } else {
              explanations.push({
                answer: 'In dieser Zeile könnte es einen Fehler haben. Prüfe, ob alles korrekt ist.',
                lineLevel: linelevel,
                isError: true,
                code: line,
              });
            }
          }
        }
      });

      //////////////////////////////////////////////////// Markers for variable names ///////////////////////////////////////////////////////////////////////////////////////
      // create a new style element
      var markerElement = document.createElement('style');
      markerElement.id = 'variableMarker';
      var cssRules = '';

      // delete styles from variableMarker element
      if (markerElement) {
        markerElement.innerHTML = '';
      }

      // loops over all variables and add marker style to variableMarker element
      variableMap.forEach(function (value, key) {
        (cssRules += '.marker' + key + '{ position:absolute; background-color: ' + value.color + '; z-index:20; opacity: 0.5;}'), 0;
      });
      markerElement.innerHTML = cssRules;

      // append the style element to the document
      document.head.appendChild(markerElement);

      // filter the storedMarkers array that there are no duplicates because the function gets called multiple times within the application
      // service.storedMarkers = service.storedMarkers.filter((value, index, self) => index === self.findIndex((t) => t.clazz === value.clazz));

      ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      // return explanations and variableMap to use it in the CodingAssistantMainCtrl & IdeCtrl
      return {
        explanations: explanations,
        variableMap: variableMap,
      };
    };
  },
]);
