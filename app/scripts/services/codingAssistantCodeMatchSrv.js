/**
 * Responsible for fetching data from coding-assistant-db, matching lines (ace-editor) with regex, generating explanations, and handling line change events.
 *
 * @author Samuel Truniger
 */

"use strict";

angular.module("codeboardApp").service("codingAssistantCodeMatchSrv", [
    "$http",
    function ($http) {
        var service = this;
        service.getJsonData = function () {
            // fetch the json data from "explanations.json"
            return $http.get("../db_codingassistant/explanations.json").then(
                function (response) {
                    return response.data;
                },
                function (error) {
                    console.error("Error fetching JSON data:", error);
                }
            );
        };

        service.getJsonColors = function () {
            // fetch the json data from "colors.json"
            return $http.get("../db_codingassistant/colors.json").then(
                function (response) {
                    return response.data;
                },
                function (error) {
                    console.error("Error fetching JSON data:", error);
                }
            );
        };

        /**
         * Process the data and return matched explanations
         * @param {Array} data the content from the explanations.json
         * @param {Array} inputCodeArray the current code in the Code-Editor
         * @param {} aceEditor the aceEditor
         * @param {Array} col the colors from the colors.json
         */
        service.getMatchedExplanations = function (data, inputCodeArray, aceEditor, col) {
            // Regexes needed for further check
            const beforeRegex = /^(public|private|protected)/;
            const staticRegex = /.* static/;
            const ifRegex = /^\s*if\s?\(.*\)\s?{/;
            const elseifRegex = /else\sif\s?\(.*\)\s?{/;
            const elseRegex = /else\s?{/;
            const catchRegex = /catch\s?/;
            const paraRegex = /(int|String|boolean|long|double|char)\s(\w+)+/;
            const newArrayDeclarationRegex = /(int|String|boolean|long|double|char)\[\]\s*(\w+);\s*$/;
            const newArrayRegex = /(int|String|boolean|long|double|char)\s*\[\]\s*(\w+)\s*=?\s*\{(.*)\};\s*$/;
            const newArrayDeclarationAndInitializationRegex = /(int|String|boolean|long|double|char)\[\]\s*(\w+)\s?=?\s*new\s*(int|String|boolean|long|double|char)\[([0-9])\]\s*;\s*$/;
            const newTwoDimensoinalArrayRegex = /(\w+)\[\]\[\]\s*(\w+)\s?=?\s*new\s*(\w+)\s*\[([0-9]+)\]\s*\[([0-9]+)\];\s*$/;
            const newStartValueTwoDimensoinalArrayRegex = /(\w+)\[\]\[\]\s*(\w+)\s*=?\s*\{(\{.*\})\};\s*$/;
            const newVarComparisationRegex = /^\s*((?:boolean))\s*(\w+)\s*\=\s*([A-z0-9$_()+\-*\/%\s]+)\s+([<=!>]+)\s+([A-z0-9$_()\-+*\/%\s]+);\s*$/;
            const redeclareVarComparisationRegex = /^\s*(\w+)\s+\=\s+([A-z0-9$_.()*\-+/%\s*]+)\s+([<=!>]+)\s+([A-z0-9$_.()*\-+/%\s*]+);\s*$/;

            var regex = [];
            var expressions = [];
            var colors = [];
            var aceEditor = aceEditor;
            // var editorLineHeight;

            // Variables needed to highlight the code in the Code-Editor
            var currLine;
            var wholeLineTxt;
            var countWhiteSpacesLine;
            var countWhiteSpaces1;
            var countWhiteSpaces2;
            var countWhiteSpaceArray;
            var countWhiteSpace2DArray;

            for (let i = 0; i < data.lines.length; i++) {
                var currentString = new RegExp(data.lines[i].regex);
                // store all regex from "line" in array
                regex.push(currentString);
            }

            for (let i = 0; i < data.expressions.length; i++) {
                var currentCondition = new RegExp(data.expressions[i].regex);
                // store all expressions from "expresssions" in array
                expressions.push(currentCondition);
            }

            // store the colors in array
            col.colors.forEach((element) => {
                colors.push(element);
            });

            // check line height from codeEditor
            // editorLineHeight = codeEditor.renderer.lineHeight;
            // console.log(editorLineHeight);

            // reset output that it wont add up
            var outputText = "";

            // text for varScope
            var varScopeText = "";

            // other used variables
            var level = 0;
            var braceLevel = 0;
            var ifActive = [];
            var blockActive = [];
            var isComment = false;
            var stayComment = false;
            var blockNotReallyEnded = false;
            var variableMap = new Map();
            var importMap = new Map();
            var variableCount = 0;
            // the rows in the ace-editor
            var linelevel = 0;

            //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            // Loop trough every line of code (from Code-Editor)
            inputCodeArray.forEach(function (line) {
                var matched = false;
                // remove the marker - due to interval
                // var markers = aceEditor.session.getMarkers(linelevel);
                // if (markers) {
                //     const prevMarkersArr = Object.keys(markers);
                //     for (let item of prevMarkersArr) {
                //         codeEditor.session.removeMarker(markers[item].id);
                //     }
                // }
                
                // with every line of code/no code the linelevel increments by 1
                linelevel++;

                ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                // Check if line is a comment and other related stuff
                if (line.match(/\/\//) || line.match(/\/\*/)) {
                    isComment = true;
                    ifActive[level] = false;
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

                ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                // Check if closing of a div is necessary (e.g. if-else statement) - needed for code-block visualization
                if (ifActive[level] === true) {
                    var removeEndDiv = false;
                    if (line.match(/[\w,.\"=+-<>!?;:\[\]\(\)\{\}]/)) {
                        removeEndDiv = true;
                    }
                    if (line.match(elseifRegex) || line.match(elseRegex) || line.match(catchRegex)) {
                        outputText = outputText.slice(0, -6);
                        ifActive[level] = false;
                    } else if (removeEndDiv === false || isComment === true) {
                        outputText = outputText.slice(0, -6);
                    }
                }
                /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                // Check if public or something like that is used
                if (line.match(beforeRegex)) {
                    var currentRegex2 = line.match(beforeRegex);
                    var before = true;
                }

                ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                // Loop all the regex over the line (Code from Code-Editor)
                regex.forEach(function (currentRegex) {
                    if (line.match(currentRegex) && matched == false && isComment == false) {
                        // matched == false to not go over it again once it matched
                        matched = true;
                        if (ifActive[level] == true) {
                            ifActive[level] = false;
                        }
                        // loops over all "lines"-objects from the json file
                        data.lines.forEach(function (dbline) {
                            // checks if the regex are the same to make sure its the right object in json => now we can use all the strings from the json file
                            if ("/" + dbline.regex + "/" == currentRegex) {
                                // capture groups are saved in currentMatch
                                const currentMatch = line.match(currentRegex);
                                // splits answer form json by ' and is stored in answerArray[]
                                var answerArray = dbline.answer.split("'");
                                if (dbline.name !== "catchRegex" && dbline.name !== "elseIfRegex" && dbline.name !== "elseRegex") {
                                    if (dbline.link != "") {
                                        outputText += "<div onclick=\"window.open('" + dbline.link + '\', \'_blank\'); event.stopPropagation();" style="cursor: pointer;" class="anyDiv ' + dbline.cssClasses;
                                    } else {
                                        outputText += '<div onclick="event.stopPropagation();" style="cursor: default;" class="anyDiv ' + dbline.cssClasses;
                                    }
                                    // If keepLevel is set to "false", this line or block of code will be indented.
                                    if (level > 0 && dbline.keepLevel == "false") {
                                        outputText += ' level">';
                                    } else if (level == 0) {
                                        outputText += ' level0">';
                                    } else {
                                        outputText += '">';
                                    }
                                }
                                if (dbline.name === "newScannerRegex" || dbline.name === "newRandomRegex") {
                                    if (importMap.has(currentMatch[2])) {
                                        matched = false;
                                    } else {
                                        importMap.set(currentMatch[2], currentMatch[1]);
                                    }
                                }
                                if (dbline.name === "methodRegex" || dbline.name === "methodVoidRegex") {
                                    // Check if static
                                    if (line.match(staticRegex)) {
                                        answerArray.unshift("Die statische ");
                                    } else answerArray.unshift("Die ");
                                    // check if parameter
                                    if (currentMatch[3].match(paraRegex)) {
                                        // split parameter
                                        const currentMatchPara = currentMatch[3].split(",");
                                        var currentRegexPara = [];
                                        currentMatchPara.forEach(function (para) {
                                            // match for each split
                                            currentRegexPara.push(para.match(paraRegex));
                                        });
                                        // if only one parameter
                                        if (currentRegexPara.length == 1) {
                                            answerArray.push(' mit dem Parameter "' + currentRegexPara[0][0] + '"');
                                        }
                                        // if 1+ parameter
                                        else if (currentRegexPara.length > 1) {
                                            answerArray.push(" mit den Parametern");
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

                                if (dbline.name === "callMethodNoInputRegex" || dbline.name === "callMethodInputRegex") {
                                    // loops through all the splitted answers
                                    for (let j = 0; j < answerArray.length; j++) {
                                        // checks if output out of the captured groups from the regex is needed
                                        if (answerArray[j].match(/^1$/)) {
                                            // position on which regex is stored in database.json
                                            const currentNumber = answerArray[j].match(/^1$/);
                                            // stores the text from "answer" in database.json to the outputText
                                            outputText += currentMatch[currentNumber];
                                        } else {
                                            // gets output from answer field in json
                                            outputText += answerArray[j];
                                        }
                                    }
                                    if (dbline.name === "callMethodInputRegex") {
                                        let inputPara = currentMatch[2].split(",");
                                        if (inputPara.length == 1) {
                                            outputText += ' mit dem Parameter "' + inputPara[0] + '"';
                                        } else if (inputPara.length > 1) {
                                            outputText += ' mit den Parametern "';
                                            for (let j = 0; j < inputPara.length; j++) {
                                                if (j == inputPara.length - 1) {
                                                    outputText += inputPara[j] + '"';
                                                } else {
                                                    outputText += inputPara[j] + ", ";
                                                }
                                            }
                                        }
                                    }
                                    outputText += " aufgerufen";
                                } else {
                                    if (dbline.looksCssClasses !== "") {
                                        outputText += '<div class="' + dbline.looksCssClasses + '">';
                                    }
                                    // loops through all the splitted answers
                                    for (let j = 0; j < answerArray.length; j++) {
                                        // checks if output out of the captured groups from the regex is needed
                                        if (answerArray[j].match(/^[0-9]*$/)) {
                                            const currentNumber = answerArray[j].match(/^[0-9]*$/);
                                            outputText += currentMatch[currentNumber];
                                        } else {
                                            // gets output from answer field in json
                                            if (j + 1 == answerArray.length && before == true) {
                                                // adds "public" or "private" to description
                                                if (answerArray[j].match(/<\/div>/)) {
                                                    answerArray[j] = answerArray[j].replaceAll("</div>", "");
                                                }
                                                outputText += answerArray[j] + " und ist " + currentRegex2[1];
                                            } else {
                                                // just adds answer text
                                                outputText += answerArray[j];
                                            }
                                        }
                                    }
                                }
                                if (dbline.keepBlock == "true") {
                                    // makes sure that the next line gets checked further
                                    ifActive[level] = true;
                                }
                                if (dbline.block == "true") {
                                    level += 1;
                                    blockActive[level] = true;
                                }
                                outputText += "</div>";
                                if (line.match(/}/) && (dbline.name === "catchRegex" || dbline.name === "elseIfRegex" || dbline.name === "elseRegex")) {
                                    blockNotReallyEnded = true;
                                }
                            }
                        });
                    }
                });

                ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                // Check if explaining a condition is needed
                data.notCheckedLines.forEach(function (dbline) {
                    // loops over the notchecked objets from the json file
                    if (line.match(dbline.regex) && isComment == false) {
                        // checks if the line matches this regex
                        var condition = line.match(dbline.regex);
                        var update;
                        if (dbline.name == "expressionforRegex") {
                            if (condition[2].match(/;/)) {
                                // stores the capture groups in condition
                                var newCondition = condition[2].split(";");
                                update = newCondition[2];
                                condition[2] = newCondition[1];
                                if (newCondition[0].match(/(int|double)\s(\w+)\s?\=\s?[0-9]+/)) {
                                    // calculate Margin & convert to string
                                    var margin = "" + (linelevel - 1); // * editorLineHeight;
                                    margin += "px";
                                    // create object with linelevel at the start, linelevel at the end, blocklevel, margin, color, keyoutput, height
                                    var variableObject = { lineLevelStart: linelevel, blockLevel: level, lineLevelEnd: 0, height: "", margin: margin, color: colors[variableCount].hexacode };
                                    var startwertMatch = newCondition[0].match(/(int|double)\s(\w+)\s?\=\s?[0-9]+/);
                                    variableMap.set(startwertMatch[2], variableObject);
                                    // create variable scope div with variable name as id
                                    varScopeText += '<div id= "' + startwertMatch[2] + '" onclick="window.open(\'' + dbline.link + '\', \'_blank\'); event.stopPropagation();" style="cursor: pointer;" class="anyDiv container ' + dbline.cssClasses + ' varScope"></div>';

                                    currLine = linelevel; // codeEditor.getSelectionRange().start.row;

                                    var Range = ace.require("ace/range").Range;
                                    wholeLineTxt = aceEditor.session.getLine(currLine - 1);
                                    countWhiteSpacesLine = wholeLineTxt.search(/\S/);
                                    countWhiteSpaces1 = wholeLineTxt.length - wholeLineTxt.replaceAll(/(?<=\w)\s+(?=\w)/gm, "").length;
                                    countWhiteSpaces2 = wholeLineTxt.length - wholeLineTxt.replaceAll(/(\w+)\s+(\()\s*/gm, "").length;
                                    aceEditor.session.addMarker(new Range(linelevel - 1, startwertMatch[1].length + countWhiteSpacesLine + countWhiteSpaces1 + countWhiteSpaces2, linelevel - 1, startwertMatch[2].length + startwertMatch[1].length + countWhiteSpacesLine + countWhiteSpaces1 + countWhiteSpaces2), startwertMatch[2], "text");
                                    variableCount++;

                                    outputText = outputText.slice(0, -6);
                                    outputText += " mit Startwert " + newCondition[0] + "; </div>";
                                }
                            }
                        }
                        // splits the things inside the () of a expression
                        var conditionArr = condition[2].split(" ");
                        outputText = outputText.slice(0, -6);
                        // solange oder falls
                        outputText += " " + dbline.answer + " ";
                        // loops through words of expression
                        for (let i = 0; i < conditionArr.length; i++) {
                            var matchedExpression = false;
                            // loops over all regex in expressions[]
                            expressions.forEach(function (currentExpression) {
                                if (conditionArr[i].match(currentExpression)) {
                                    // loops over all expression objects from the json file
                                    data.expressions.forEach(function (dbexpression) {
                                        // checks if the regex are the same to make sure its the right object in json => now we can use all the strings from the json file
                                        if (currentExpression == "/" + dbexpression.regex + "/") {
                                            outputText += dbexpression.answer + " "; // input not needed (fe: == gets replaced)
                                            if (outputText.match(/cg1/)) {
                                                const currentMatch = conditionArr[i].match(currentExpression);
                                                // replace capturegroup 1 (cg1) with the captured content
                                                outputText = outputText.replaceAll("cg1", currentMatch[1]);
                                                if (outputText.match(/cg2/)) {
                                                    outputText = outputText.replaceAll("cg2", currentMatch[2]);
                                                }
                                                if (conditionArr[i].match(/\;/)) {
                                                    // put the ";" back in place
                                                    outputText = outputText.slice(0, -1);
                                                    outputText += "; ";
                                                }
                                            }
                                            matchedExpression = true;
                                        }
                                    });
                                }
                            });

                            if (matchedExpression == false) {
                                outputText += conditionArr[i] + " ";
                            }
                        }
                        if (condition[2].match(/^[A-z0-9]+$/)) {
                            outputText += "true ist";
                        } else if (condition[2].match(/^![A-z0-9]+$/)) {
                            outputText = outputText.replace("!", "");
                            outputText += "false ist";
                        } else if (condition[2].match(/!/)) {
                            outputText = outputText.replaceAll("!", "NOT");
                        }
                        if (dbline.name === "expressionforRegex") {
                            data.expressions.forEach(function (expression) {
                                if (update.match(expression.regex)) {
                                    var updateMatch = update.match(expression.regex);
                                    outputText += "; " + expression.answer.replaceAll("cg1", updateMatch[1]);
                                }
                            });
                        }
                        outputText += "</div>";
                    }
                });

                ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                // Check if it is a Print-Statement
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
                        if (dbline.link != "") {
                            // div mit oder ohne Link und Klasse hinzufügen
                            outputText += "<div onclick=\"window.open('" + dbline.link + '\', \'_blank\'); event.stopPropagation();" style="cursor: pointer;" class="anyDiv ' + dbline.cssClasses;
                        } else {
                            outputText += '<div onclick="event.stopPropagation();" style="cursor: default;" class="anyDiv ' + dbline.cssClasses;
                        }
                        if (level > 0 && dbline.keepLevel == "false") {
                            outputText += ' level">';
                        } else if (level == 0) {
                            outputText += ' level0">';
                        } else {
                            outputText += '">';
                        }
                        // store print statement in new variable "printStatement"
                        var printStatement = currentMatch[1];
                        var checkPrintStatement;
                        if (printStatement == "") {
                            for (let j = 0; j < printAnswerArray.length; j++) {
                                // add "printAnswerArray" to outputTextPrint
                                outputText += printAnswerArray[j] + " ";
                            }
                        } else {
                            // initialize "anserArray"
                            var answerArray;
                            // loop trough all printExpressions
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
                                            printExpressionAnswerArray[j] = '"' + checkPrintStatement[currentNumber] + '"';
                                        }
                                    }
                                    if (currentExpression.name === "callMethodInputRegex") {
                                        let inputPara = checkPrintStatement[2].split(",");
                                        //console.log(printExpressionAnswerArray);
                                        if (inputPara.length == 1) {
                                            printExpressionAnswerArray.splice(2, 0, ' mit dem Parameter "' + inputPara[0] + '"');
                                        } else if (inputPara.length > 1) {
                                            let callMethod = ' mit den Parametern "';
                                            for (let j = 0; j < inputPara.length; j++) {
                                                if (j == inputPara.length - 1) {
                                                    callMethod += inputPara[j] + '"';
                                                } else {
                                                    callMethod += inputPara[j] + ", ";
                                                }
                                            }
                                            printExpressionAnswerArray.splice(2, 0, callMethod);
                                        }
                                    }
                                    answerArray = printExpressionAnswerArray.concat(printAnswerArray);
                                }
                            });
                            for (let j = 0; j < answerArray.length; j++) {
                                // add answerArray to outputText
                                outputText += answerArray[j] + " ";
                            }
                        }
                        outputText += "</div>";
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
                        } else {
                            var wrongRandomScanner = false;
                            var randomScannerMatch = false;
                            if (dbline.name === "randomOrScannerRegex") {
                                //console.log(currentMatch);
                                if (importMap.has(currentMatch[3])) {
                                    if (importMap.get(currentMatch[3]) === "Random") {
                                        data.randomExpressions.forEach(function (rnExpression) {
                                            if (currentMatch[0].match(rnExpression.regex)) {
                                                varScopeAnswerArray = rnExpression.answer.split("'");
                                                randomScannerMatch = true;
                                                dbline.link = "https://www.javatpoint.com/how-to-generate-random-number-in-java";
                                            }
                                        });
                                    } else if (importMap.get(currentMatch[3]) === "Scanner") {
                                        data.scannerExpressions.forEach(function (ksExpression) {
                                            if (currentMatch[0].match(ksExpression.regex)) {
                                                varScopeAnswerArray = ksExpression.answer.split("'");
                                                randomScannerMatch = true;
                                                dbline.link = "https://www.w3schools.com/java/java_user_input.asp";
                                            }
                                        });
                                    }
                                }
                                if (randomScannerMatch == false) {
                                    wrongRandomScanner = true;
                                }
                            }
                            // check if variable is already declared
                            if (variableMap.has(currentMatch[2]) == false && wrongRandomScanner == false) {
                                // set matched on true to not get recognize as not identify
                                matched = true;
                                // calculate Margin & convert to string
                                var margin = "" + (linelevel - 1); // * editorLineHeight;
                                // add pixel
                                margin += "px";
                                // create object with linelevel at the start, linelevel at the end, blocklevel, margin, color, keyoutput, height
                                var variableObject = { lineLevelStart: linelevel, blockLevel: level, lineLevelEnd: 0, height: "", margin: margin, color: colors[variableCount].hexacode };
                                // add object to variable map with variable name as key
                                variableMap.set(currentMatch[2], variableObject);
                                var Range = ace.require("ace/range").Range;

                                currLine = linelevel; //codeEditor.getSelectionRange().start.row;
                                // get the code from the current line
                                wholeLineTxt = aceEditor.session.getLine(currLine - 1);
                                // count whitespaces before beginning of the code
                                countWhiteSpacesLine = wholeLineTxt.search(/\S/);
                                // count whitespaces between first and second word
                                countWhiteSpaces1 = wholeLineTxt.length - wholeLineTxt.replace(/\b\s+\b/, "").length;
                                //(?<=\w)\s+(?=\w)
                                //(?<=[\w\[\]])\s+(?=\w[^int\[\]]
                                if (wholeLineTxt.match(newArrayDeclarationRegex) || wholeLineTxt.match(newArrayRegex) || wholeLineTxt.match(newArrayDeclarationAndInitializationRegex)) {
                                    countWhiteSpaces1 = wholeLineTxt.length - wholeLineTxt.replace(/(?<=\w\[\])\s+(?=\w)/, "").length;
                                    countWhiteSpaceArray = wholeLineTxt.length - wholeLineTxt.replaceAll(/(\[)\s*(\])/gm, "").length;
                                    // add marker to the variable name
                                    aceEditor.session.addMarker(new Range(linelevel - 1, countWhiteSpacesLine + currentMatch[1].length + countWhiteSpaceArray + countWhiteSpaces1, linelevel - 1, currentMatch[2].length + countWhiteSpacesLine + currentMatch[1].length + countWhiteSpaceArray + countWhiteSpaces1), currentMatch[2], "text");
                                } else if (wholeLineTxt.match(newTwoDimensoinalArrayRegex) || wholeLineTxt.match(newStartValueTwoDimensoinalArrayRegex)) {
                                    countWhiteSpaces1 = wholeLineTxt.length - wholeLineTxt.replace(/(?<=\w\[\]\[\])\s+(?=\w)/, "").length;
                                    countWhiteSpace2DArray = wholeLineTxt.length - wholeLineTxt.replaceAll(/(\[)\s*(\])/gm, "").length;
                                    // add marker to the variable name
                                    aceEditor.session.addMarker(new Range(linelevel - 1, countWhiteSpacesLine + currentMatch[1].length + countWhiteSpace2DArray + countWhiteSpaces1, linelevel - 1, currentMatch[2].length + countWhiteSpacesLine + currentMatch[1].length + countWhiteSpace2DArray + countWhiteSpaces1), currentMatch[2], "text");
                                } else {
                                    // add marker to the variable name
                                    aceEditor.session.addMarker(new Range(linelevel - 1, currentMatch[1].length + countWhiteSpacesLine + countWhiteSpaces1, linelevel - 1, currentMatch[2].length + currentMatch[1].length + countWhiteSpacesLine + countWhiteSpaces1), currentMatch[2]);
                                }
                                // increase variableCount -> different color & outputid for every variable
                                variableCount++;

                                outputText += "<div onclick=\"window.open('" + dbline.link + '\', \'_blank\'); event.stopPropagation();" style="cursor: pointer;" class="anyDiv '; // create outputtext div with genereted keyoutput as id
                                varScopeText += '<div id= "' + currentMatch[2] + '" onclick="window.open(\'' + dbline.link + '\', \'_blank\'); event.stopPropagation();" style="cursor: pointer;" class="anyDiv container '; // create variable scope div with variable name as id

                                // check if level is bigger then 0 and if the code is indented
                                if (level > 0 && dbline.keepLevel == "false") {
                                    if (line.match(data.varScope.regex)) {
                                        // .level in css --> padding-left: 15px;
                                        outputText += ' level">';
                                        varScopeText += ' varScope">';
                                    }
                                } // check if level is equals to 0
                                else if (level == 0) {
                                    if (line.match(data.varScope.regex)) {
                                        // .level in css --> min-widht: 100%;
                                        outputText += ' level0">';
                                        varScopeText += ' varScope">';
                                    }
                                } else {
                                    outputText += '">';
                                    varScopeText += '">';
                                }
                                if (dbline.name === "newVarCallMethodRegex") {
                                    if (currentMatch[4] !== "") {
                                        let inputPara = currentMatch[4].split(",");
                                        if (inputPara.length == 1) {
                                            varScopeAnswerArray.splice(2, 0, '" mit dem Parameter "' + inputPara[0]);
                                        } else if (inputPara.length > 1) {
                                            let callMethod = '" mit den Parametern "';
                                            for (let j = 0; j < inputPara.length; j++) {
                                                if (j == inputPara.length - 1) {
                                                    callMethod += inputPara[j];
                                                } else {
                                                    callMethod += inputPara[j] + ", ";
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
                                        // stores the text from "answer" in database.json to the outputText
                                        outputText += currentMatch[currentNumber];
                                    } else {
                                        // gets output from answer field in json & just adds answer text
                                        outputText += varScopeAnswerArray[j];
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
                                            outputText = outputText.replace("expr", answerArray);
                                        }
                                    });
                                }

                                if (dbline.name === "newVariableBitOperationRegex") {
                                    var bitOpExprAnswerArray;
                                    // loops over all expression objects from the json file
                                    data.bitOperationExpression.forEach(function (currentExpression) {
                                        if (currentMatch[4].match(currentExpression.regex)) {
                                            // split answer of print expression and stroe it in bitOpExprAnswerArray
                                            bitOpExprAnswerArray = currentExpression.answer;
                                            outputText = outputText.replace("operation", bitOpExprAnswerArray);
                                        }
                                    });
                                }

                                if (dbline.name === "newVariableLogicOperatorRegex") {
                                    var LogicOpExprAnswerArray;
                                    // loops over all expression objects from the json file
                                    data.logicOperatorExpressions.forEach(function (currentExpression) {
                                        if (currentMatch[4].match(currentExpression.regex)) {
                                            // split answer of print expression and store it in LogicOpExprAnswerArray
                                            LogicOpExprAnswerArray = currentExpression.answer;
                                            outputText = outputText.replace("logic", LogicOpExprAnswerArray);
                                        }
                                    });
                                }

                                if (dbline.name === "newVariableLogicOperatorNOTRegex") {
                                    var LogicOpNOTExprAnswerArray;
                                    // loops over all expression objects from the json file
                                    data.logicOperatorExpressions.forEach(function (currentExpression) {
                                        if (currentMatch[3].match(currentExpression.regex)) {
                                            // split answer of print expression and store it in LogicOpNOTExprAnswerArray
                                            LogicOpNOTExprAnswerArray = currentExpression.answer;
                                            outputText = outputText.replace("logic", LogicOpNOTExprAnswerArray);
                                        }
                                    });
                                }

                                // varScopeText += linelevel;
                                varScopeText += "</div>";
                                // code-block gets closed
                                outputText += "</div>";
                            } else if (variableMap.has(currentMatch[2]) == true || wrongRandomScanner == true) {
                                matched = false;
                            }
                        }
                    }
                });

                ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                //Check how many open {} there are => only close a block when it actually gets closed
                if (line.match(/{/) && isComment != true) {
                    var count = line.match(/{/g).length;
                    braceLevel += count;
                }
                if (line.match(/}/) && isComment != true) {
                    var count = line.match(/}/g).length;
                    braceLevel -= count;
                }

                ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                //End of any block
                if (line.match(/}/) && blockActive[level] == true && level - braceLevel == 1 && blockNotReallyEnded != true) {
                    if (ifActive[level + 1] == true) {
                        //stops ifActive on level higher if this block is over
                        ifActive[level + 1] = false;
                    }
                    if (matched == false) {
                        if (ifActive[level] == true) {
                            // outputText += '<div class="looksNice">Code-Block wird beendet</div></div>';
                            outputText += '<div class="looksNice"></div></div>';
                            variableMap.forEach(function (value, key) {
                                // loops over all variables in map
                                if (value.blockLevel == level && value.lineLevelEnd == 0) {
                                    // checks if current variable has the same blocklevel and has no linelevelend
                                    value.lineLevelEnd = linelevel;
                                    // calculate height and convert to string
                                    var height = "" + (value.lineLevelEnd - value.lineLevelStart); // * editorLineHeight;
                                    // add px (pixel) to height
                                    height += "px";
                                    // height is assigned to height of current variable
                                    value.height = height;
                                }
                            });
                        } else {
                            // outputText += '<div class="looksNiceEnd">Code-Block wird beendet</div></div>'; // when if / else or for- / while- loop code block ends#
                            outputText += '<div class="looksNiceEnd"></div></div>';
                            variableMap.forEach(function (value, key) {
                                // loops over all variables in map
                                if (value.blockLevel == level && value.lineLevelEnd == 0) {
                                    // checks if current variable has the same blocklevel and has no linelevelend
                                    value.lineLevelEnd = linelevel;
                                    // calculate height and convert to string
                                    var height = "" + (value.lineLevelEnd - value.lineLevelStart); // * editorLineHeight;
                                    // add px (pixel) to height
                                    height += "px";
                                    // height is assigned to height of current variable
                                    value.height = height;
                                }
                            });
                        }
                    } else {
                        outputText += "</div>";
                    }
                    blockActive[level] = false;
                    level -= 1;
                    matched = true;
                } else if (line.match(/}/) && blockActive[level] == true && level - braceLevel == 1 && blockNotReallyEnded == true && matched == true && braceLevel == 0) {
                    outputText += "</div>";
                }
                if (blockNotReallyEnded == true) {
                    //if the block didnt really end we stil have to reduce the level by 1 because its gonna add 1 more again
                    level -= 1;
                    blockNotReallyEnded = false;
                }
                // loops over all variables in map
                variableMap.forEach(function (value, key) {
                    // checks if current variable has the blocklevel = 0
                    if (value.blockLevel == 0) {
                        // actual linelevel is assigned to linelevelend of current variable
                        value.lineLevelEnd = linelevel;
                        // calculate height and convert to string
                        var height = "" + (value.lineLevelEnd - value.lineLevelStart + 1); // * editorLineHeight;
                        // add px (pixel) to height
                        height += "px";
                        // height is assigned to height of current variable
                        value.height = height;
                    }
                });
                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////7
                // Variables redeclaration
                data.redeclareVar.forEach(function (dbline) {
                    if (line.match(dbline.regex) && matched == false && isComment == false) {
                        // check if new Variable & store cg in a new variable
                        var currentMatch = line.match(dbline.regex);
                        // split answer and store in new array
                        var redeclarVarAnswerArray = dbline.answer.split("'");
                        var wrongRandomScanner = false;
                        var randomScannerMatch = false;
                        if (dbline.name === "randomOrScannerRegex") {
                            //console.log(currentMatch);
                            if (importMap.has(currentMatch[2])) {
                                if (importMap.get(currentMatch[2]) === "Random") {
                                    data.randomExpressions.forEach(function (rnExpression) {
                                        if (currentMatch[0].match(rnExpression.regex)) {
                                            redeclarVarAnswerArray = rnExpression.answer.split("'");
                                            randomScannerMatch = true;
                                            dbline.link = "https://www.javatpoint.com/how-to-generate-random-number-in-java";
                                        }
                                    });
                                } else if (importMap.get(currentMatch[2]) === "Scanner") {
                                    data.scannerExpressions.forEach(function (ksExpression) {
                                        if (currentMatch[0].match(ksExpression.regex)) {
                                            redeclarVarAnswerArray = ksExpression.answer.split("'");
                                            randomScannerMatch = true;
                                            dbline.link = "https://www.w3schools.com/java/java_user_input.asp";
                                        }
                                    });
                                }
                            }
                            if (randomScannerMatch == false) {
                                wrongRandomScanner = true;
                            }
                        }
                        if (variableMap.has(currentMatch[1]) && wrongRandomScanner == false) {
                            if (linelevel == variableMap.get(currentMatch[1]).lineLevelEnd && variableMap.get(currentMatch[1]).blockLevel == 0) {
                                matched = true;
                            } else if (variableMap.get(currentMatch[1]).blockLevel <= level && variableMap.get(currentMatch[1]).lineLevelEnd == 0) {
                                matched = true;
                            } else {
                                matched = false;
                            }
                        } else {
                            matched = false;
                        }

                        if (matched == true) {
                            var Range = ace.require("ace/range").Range;
                            currLine = linelevel; //codeEditor.getSelectionRange().start.row;
                            wholeLineTxt = aceEditor.session.getLine(currLine - 1);
                            // count whitespaces before first character of code
                            countWhiteSpacesLine = wholeLineTxt.search(/\S/);
                            // add marker
                            aceEditor.session.addMarker(new Range(linelevel - 1, countWhiteSpacesLine, linelevel - 1, currentMatch[1].length + countWhiteSpacesLine), currentMatch[1], "text");

                            // create outputtext div with genereted keyoutput as id
                            outputText += "<div onclick=\"window.open('" + dbline.link + '\', \'_blank\'); event.stopPropagation();" style="cursor: pointer;" class="anyDiv ' + dbline.cssClasses;

                            if (level > 0 && dbline.keepLevel == "false") {
                                // check if level is bigger then 0 and if the code is indented
                                if (line.match(data.redeclareVar.regex)) {
                                    // .level in css --> padding-left: 15px;
                                    outputText += ' level">';
                                }
                            } else if (level == 0) {
                                // check if level is equals to 0
                                if (line.match(data.redeclareVar.regex)) {
                                    // .level in css --> min-widht: 100%;
                                    outputText += ' level0">';
                                }
                            } else {
                                outputText += '">';
                            }

                            if (dbline.name === "redeclareVariableCallMethodRegex") {
                                if (currentMatch[3] !== "") {
                                    let inputPara = currentMatch[3].split(",");
                                    if (inputPara.length == 1) {
                                        redeclarVarAnswerArray.splice(2, 0, '" mit dem Parameter "' + inputPara[0]);
                                    } else if (inputPara.length > 1) {
                                        let callMethod = '" mit den Parametern "';
                                        for (let j = 0; j < inputPara.length; j++) {
                                            if (j == inputPara.length - 1) {
                                                callMethod += inputPara[j];
                                            } else {
                                                callMethod += inputPara[j] + ", ";
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
                                    // stores the text from "answer" in database.json to the outputText
                                    outputText += currentMatch[currentNumber];
                                } else {
                                    // gets output from answer field in json and just adds answer text
                                    outputText += redeclarVarAnswerArray[j];
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
                                // replace word expr in database.json with the correct value
                                outputText = outputText.replace("expr", answerArray);
                            }
                            if (dbline.name === "redeclareVariableBitOperationRegex") {
                                var bitOpExprAnswerArray;
                                data.bitOperationExpression.forEach(function (currentExpression) {
                                    // loops over all expression objects from the json file
                                    if (currentMatch[3].match(currentExpression.regex)) {
                                        // split answer of print expression and store it in bitOpExprAnswerArray
                                        bitOpExprAnswerArray = currentExpression.answer;
                                        outputText = outputText.replace("operation", bitOpExprAnswerArray);
                                    }
                                });
                            }

                            if (dbline.name === "redeclareVariableLogicOperatorRegex") {
                                var LogicOpExprAnswerArray;
                                data.logicOperatorExpressions.forEach(function (currentExpression) {
                                    // loops over all expression objects from the json file
                                    if (currentMatch[3].match(currentExpression.regex)) {
                                        // split answer of print expression and store it in LogicOpExprAnswerArray
                                        LogicOpExprAnswerArray = currentExpression.answer;
                                        outputText = outputText.replace("logic", LogicOpExprAnswerArray);
                                    }
                                });
                            }

                            if (dbline.name === "redeclareVariableLogicOperatorNOTRegex") {
                                var LogicOpNOTExprAnswerArray;
                                data.logicOperatorExpressions.forEach(function (currentExpression) {
                                    //loops over all expression objects from the json file
                                    if (currentMatch[2].match(currentExpression.regex)) {
                                        // split answer of print expression and store it in LogicOpNOTExprAnswerArray
                                        LogicOpNOTExprAnswerArray = currentExpression.answer;
                                        outputText = outputText.replace("logic", LogicOpNOTExprAnswerArray);
                                    }
                                });
                            }
                            // code-block gets closed
                            outputText += "</div>";
                        }
                    }
                });

                ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                // checks if something is a comment --> if so the comment does not get highlighted
                if (isComment == true) {
                    matched = true;
                    outputText += '<div onclick="event.stopPropagation();" style="cursor: default;" class="anyDiv unknown looksNice level">' + line + "\u200B</div>";
                }
                // Stuff that doesnt get recognized by an array from the json file
                if (matched == false) {
                    // checks if level is higher then 0 and if there is something typed that does not get recognized --> highlight code red
                    if (line.match(/^\s*[a-zA-Z0-9]+/)) {
                        outputText += '<div onclick="event.stopPropagation();" style="cursor: default;" class="anyDiv unknown-error looksNice level">' + line + "\u200B</div>";
                    } else { // if nothing is typed in the line it will not highlight anything
                        outputText += '<div onclick="event.stopPropagation();" style="cursor: default;" class="anyDiv unknown looksNice level">' + line + "\u200B</div>";
                    }
                }
            });
            return outputText;
        };
    },
]);
