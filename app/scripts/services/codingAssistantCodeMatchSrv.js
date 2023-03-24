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
            // fetch the json data
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
            // fetch the json data
            return $http.get("../db_codingassistant/colors.json").then(
                function (response) {
                    return response.data;
                },
                function (error) {
                    console.error("Error fetching JSON data:", error);
                }
            );
        };

        // Process the data and return matched explanations
        service.getMatchedExplanations = function (data, inputCodeArray, aceEditor, col) {
            //Regexes
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

            //Highlight the code in editorCode
            var currLine;
            var wholeLineTxt;
            var countWhiteSpacesLine;
            var countWhiteSpaces1;
            var countWhiteSpaces2;
            var countWhiteSpaceArray;
            var countWhiteSpace2DArray;

            for (let i = 0; i < data.lines.length; i++) {
                var currentString = new RegExp(data.lines[i].regex);
                regex.push(currentString);
            }

            for (let i = 0; i < data.expressions.length; i++) {
                var currentCondition = new RegExp(data.expressions[i].regex);
                expressions.push(currentCondition);
            }

            col.colors.forEach((element) => {
                colors.push(element);
            });

            // editorLineHeight = codeEditor.renderer.lineHeight; // check line height from codeEditor
            // console.log(editorLineHeight);

            //reset output that it wont add up
            var outputText = "";

            //text for varScope
            var varScopeText = "";

            //other used variables
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
            var linelevel = 0;

            //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            //Loop every line of code
            inputCodeArray.forEach(function (line) {
                var matched = false;
                // var markers = aceEditor.session.getMarkers(linelevel); // remove the marker - due to interval
                // if (markers) {
                //     const prevMarkersArr = Object.keys(markers);
                //     for (let item of prevMarkersArr) {
                //         codeEditor.session.removeMarker(markers[item].id);
                //     }
                // }
                linelevel++;

                ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                //Check if line is a comment and other related stuff
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
                //Check if closing of a div is necessary (if statement)
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
                //Check if public or something like that is used
                if (line.match(beforeRegex)) {
                    var currentRegex2 = line.match(beforeRegex);
                    var before = true;
                }

                ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                //Loop all the regex over the line
                regex.forEach(function (currentRegex) {
                    //loops over all regex in regex[]
                    if (line.match(currentRegex) && matched == false && isComment == false) {
                        //matched == false to not go over it again once it matched
                        matched = true;
                        if (ifActive[level] == true) {
                            ifActive[level] = false;
                        }
                        data.lines.forEach(function (dbline) {
                            //loops over all "lines"-objects from the json file
                            if ("/" + dbline.regex + "/" == currentRegex) {
                                //checks if the regex are the same to make sure its the right object in json => now we can use all the strings from the json file
                                const currentMatch = line.match(currentRegex); //capture groups are saved in currentMatch
                                var answerArray = dbline.answer.split("'"); //splits answer form json by ' and is stored in answerArray[]
                                if (dbline.name !== "catchRegex" && dbline.name !== "elseIfRegex" && dbline.name !== "elseRegex") {
                                    if (dbline.link != "") {
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
                                }
                                if (dbline.name === "newScannerRegex" || dbline.name === "newRandomRegex") {
                                    if (importMap.has(currentMatch[2])) {
                                        matched = false;
                                    } else {
                                        importMap.set(currentMatch[2], currentMatch[1]);
                                    }
                                    //console.log(importMap.get(currentMatch[2]));
                                }
                                if (dbline.name === "methodRegex" || dbline.name === "methodVoidRegex") {
                                    //console.log(dbline.name)
                                    if (line.match(staticRegex)) {
                                        // Check if static
                                        answerArray.unshift("Die statische ");
                                    } else answerArray.unshift("Die ");

                                    if (currentMatch[3].match(paraRegex)) {
                                        // check if parameter
                                        const currentMatchPara = currentMatch[3].split(","); // split parameter
                                        var currentRegexPara = [];
                                        currentMatchPara.forEach(function (para) {
                                            // match for each splitt
                                            currentRegexPara.push(para.match(paraRegex));
                                        });

                                        if (currentRegexPara.length == 1) {
                                            // if only one parameter
                                            answerArray.push(' mit dem Parameter "' + currentRegexPara[0][0] + '"');
                                        } else if (currentRegexPara.length > 1) {
                                            // if 1+ parameter
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
                                    for (let j = 0; j < answerArray.length; j++) {
                                        //loops through all the splitted answers
                                        if (answerArray[j].match(/^1$/)) {
                                            //checks if output out of the captured groups from the regex is needed
                                            const currentNumber = answerArray[j].match(/^1$/); //position on which regex is stored in database.json
                                            outputText += currentMatch[currentNumber]; //stores the text from "answer" in database.json to the outputText
                                        } else {
                                            //gets output from answer field in json
                                            outputText += answerArray[j]; //just adds answer text
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
                                    for (let j = 0; j < answerArray.length; j++) {
                                        //loops through all the splitted answers
                                        if (answerArray[j].match(/^[0-9]*$/)) {
                                            //checks if output out of the captured groups from the regex is needed
                                            const currentNumber = answerArray[j].match(/^[0-9]*$/);
                                            outputText += currentMatch[currentNumber];
                                        } else {
                                            //gets output from answer field in json
                                            if (j + 1 == answerArray.length && before == true) {
                                                //adds public or private to description
                                                if (answerArray[j].match(/<\/div>/)) {
                                                    answerArray[j] = answerArray[j].replaceAll("</div>", "");
                                                }
                                                outputText += answerArray[j] + " und ist " + currentRegex2[1];
                                                //console.log(currentRegex2);
                                            } else {
                                                //just adds answer text
                                                outputText += answerArray[j];
                                            }
                                        }
                                    }
                                }
                                if (dbline.keepBlock == "true") {
                                    //makes sure that the next line gets checked further
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
                //Check if explaining a condition is needed
                data.notCheckedLines.forEach(function (dbline) {
                    //loops over the notchecked objets from the json file
                    if (line.match(dbline.regex) && isComment == false) {
                        //checks if the line matches this regex
                        var condition = line.match(dbline.regex);
                        var update; //stores the capture groups in condition
                        if (dbline.name == "expressionforRegex") {
                            if (condition[2].match(/;/)) {
                                var newCondition = condition[2].split(";");
                                //console.log(newCondition);
                                update = newCondition[2];
                                //console.log(update);
                                condition[2] = newCondition[1];
                                if (newCondition[0].match(/(int|double)\s(\w+)\s?\=\s?[0-9]+/)) {
                                    var margin = "" + (linelevel - 1); // * editorLineHeight; // calculate Margin & convert to string
                                    margin += "px";
                                    var variableObject = { lineLevelStart: linelevel, blockLevel: level, lineLevelEnd: 0, height: "", margin: margin, color: colors[variableCount].hexacode }; // create object with linelevel at the start, linelevel at the end, blocklevel, margin, color, keyoutput, height

                                    //console.log(variableObject)
                                    var startwertMatch = newCondition[0].match(/(int|double)\s(\w+)\s?\=\s?[0-9]+/);
                                    //console.log(startwertMatch[2]);
                                    variableMap.set(startwertMatch[2], variableObject);

                                    varScopeText += '<div id= "' + startwertMatch[2] + '" onclick="window.open(\'' + dbline.link + '\', \'_blank\'); event.stopPropagation();" style="cursor: pointer;" class="anyDiv container ' + dbline.cssClasses + ' varScope"></div>'; // create variable scope div with variable name as id

                                    currLine = linelevel; //codeEditor.getSelectionRange().start.row;

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
                        var conditionArr = condition[2].split(" "); //splits the things inside the () of a expression
                        outputText = outputText.slice(0, -6);
                        outputText += " " + dbline.answer + " "; //solange oder falls
                        for (let i = 0; i < conditionArr.length; i++) {
                            //loops through words of expression
                            var matchedExpression = false;
                            expressions.forEach(function (currentExpression) {
                                //loops over all regex in expressions[]
                                if (conditionArr[i].match(currentExpression)) {
                                    data.expressions.forEach(function (dbexpression) {
                                        //loops over all expression objects from the json file
                                        if (currentExpression == "/" + dbexpression.regex + "/") {
                                            //checks if the regex are the same to make sure its the right object in json => now we can use all the strings from the json file
                                            outputText += dbexpression.answer + " "; //input not needed (fe: == gets replaced)
                                            if (outputText.match(/cg1/)) {
                                                //replace capturegroup 1 (cg1) with the captured content
                                                const currentMatch = conditionArr[i].match(currentExpression);
                                                outputText = outputText.replaceAll("cg1", currentMatch[1]);
                                                if (outputText.match(/cg2/)) {
                                                    outputText = outputText.replaceAll("cg2", currentMatch[2]);
                                                }
                                                if (conditionArr[i].match(/\;/)) {
                                                    //put the ";" back in place
                                                    outputText = outputText.slice(0, -1);
                                                    outputText += "; ";
                                                }
                                            }
                                            matchedExpression = true;
                                            //console.log(outputText);
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
                    if (line.match(dbline.regex) && matched == false && isComment == false) {
                        // check if print statement
                        var currentMatch = line.match(dbline.regex); // capture groups in neuer variabel speichern
                        var printAnswerArray = dbline.answer.split("'"); // antwort spliten und in neuem array speichern
                        matched = true; // matched true setzen um nicht als "nicht erkannet" klassifiziert werden
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
                        var printStatement = currentMatch[1]; // store print statement in new variable "printStatement"
                        var checkPrintStatement;
                        if (printStatement == "") {
                            for (let j = 0; j < printAnswerArray.length; j++) {
                                outputText += printAnswerArray[j] + " "; // add "printAnswerArray" to outputTextPrint
                            }
                        } else {
                            var answerArray; // initialize "anserArray"
                            data.printExpressions.forEach(function (currentExpression) {
                                // loop trough all printExpressions
                                if (printStatement.match(currentExpression.regex) && matchedPrintExpression == false) {
                                    // check if printExpression gets matched
                                    matchedPrintExpression = true;
                                    var printExpressionAnswerArray = currentExpression.answer.split("'"); // split answer of the printExpressions and store it in the printExpressionAnswerArray
                                    checkPrintStatement = printStatement.match(currentExpression.regex); // store capture groups in a new array
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
                                outputText += answerArray[j] + " "; // add answerArray to outputText
                            }
                        }
                        outputText += "</div>";
                    }
                });

                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////7
                // Variables Scope
                data.varScope.forEach(function (dbline) {
                    if (line.match(dbline.regex) && matched == false && isComment == false) {
                        // check if new Variable
                        var currentMatch = line.match(dbline.regex); // store cg in a new variable
                        var varScopeAnswerArray = dbline.answer.split("'"); // split answer and store in new array

                        if (currentMatch[2].match(/^[0-9_.&$"!*+'#]+/)) {
                            //check if variableName starts with a number or sc else --> highlight it as error
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
                            if (variableMap.has(currentMatch[2]) == false && wrongRandomScanner == false) {
                                // check if variable is already declared
                                matched = true; // set matched on true to not get recognize as not identify

                                var margin = "" + (linelevel - 1); // * editorLineHeight; // calculate Margin & convert to string
                                margin += "px"; // add pixel
                                var variableObject = { lineLevelStart: linelevel, blockLevel: level, lineLevelEnd: 0, height: "", margin: margin, color: colors[variableCount].hexacode }; // create object with linelevel at the start, linelevel at the end, blocklevel, margin, color, keyoutput, height

                                variableMap.set(currentMatch[2], variableObject); // add object to variable map with variable name as key
                                var Range = ace.require("ace/range").Range; // add Marker

                                currLine = linelevel; //codeEditor.getSelectionRange().start.row;
                                wholeLineTxt = aceEditor.session.getLine(currLine - 1); // get the code from the current line
                                countWhiteSpacesLine = wholeLineTxt.search(/\S/); // count whitespaces before beginning of the code
                                countWhiteSpaces1 = wholeLineTxt.length - wholeLineTxt.replace(/\b\s+\b/, "").length; // count whitespaces between first and second word
                                //(?<=\w)\s+(?=\w)
                                //(?<=[\w\[\]])\s+(?=\w[^int\[\]]
                                if (wholeLineTxt.match(newArrayDeclarationRegex) || wholeLineTxt.match(newArrayRegex) || wholeLineTxt.match(newArrayDeclarationAndInitializationRegex)) {
                                    countWhiteSpaces1 = wholeLineTxt.length - wholeLineTxt.replace(/(?<=\w\[\])\s+(?=\w)/, "").length;
                                    countWhiteSpaceArray = wholeLineTxt.length - wholeLineTxt.replaceAll(/(\[)\s*(\])/gm, "").length;
                                    // ad marker to the variable name
                                    aceEditor.session.addMarker(new Range(linelevel - 1, countWhiteSpacesLine + currentMatch[1].length + countWhiteSpaceArray + countWhiteSpaces1, linelevel - 1, currentMatch[2].length + countWhiteSpacesLine + currentMatch[1].length + countWhiteSpaceArray + countWhiteSpaces1), currentMatch[2], "text");
                                } else if (wholeLineTxt.match(newTwoDimensoinalArrayRegex) || wholeLineTxt.match(newStartValueTwoDimensoinalArrayRegex)) {
                                    countWhiteSpaces1 = wholeLineTxt.length - wholeLineTxt.replace(/(?<=\w\[\]\[\])\s+(?=\w)/, "").length;
                                    countWhiteSpace2DArray = wholeLineTxt.length - wholeLineTxt.replaceAll(/(\[)\s*(\])/gm, "").length;
                                    // ad marker to the variable name
                                    aceEditor.session.addMarker(new Range(linelevel - 1, countWhiteSpacesLine + currentMatch[1].length + countWhiteSpace2DArray + countWhiteSpaces1, linelevel - 1, currentMatch[2].length + countWhiteSpacesLine + currentMatch[1].length + countWhiteSpace2DArray + countWhiteSpaces1), currentMatch[2], "text");
                                } else {
                                    // ad marker to the variable name
                                    aceEditor.session.addMarker(new Range(linelevel - 1, currentMatch[1].length + countWhiteSpacesLine + countWhiteSpaces1, linelevel - 1, currentMatch[2].length + currentMatch[1].length + countWhiteSpacesLine + countWhiteSpaces1), currentMatch[2]);
                                }
                                variableCount++; // increase variableCount -> different color & outputid for every variable

                                outputText += "<div onclick=\"window.open('" + dbline.link + '\', \'_blank\'); event.stopPropagation();" style="cursor: pointer;" class="anyDiv '; // create outputtext div with genereted keyoutput as id
                                varScopeText += '<div id= "' + currentMatch[2] + '" onclick="window.open(\'' + dbline.link + '\', \'_blank\'); event.stopPropagation();" style="cursor: pointer;" class="anyDiv container '; // create variable scope div with variable name as id

                                if (level > 0 && dbline.keepLevel == "false") {
                                    // check if level is bigger then 0 and if the code is indented
                                    if (line.match(data.varScope.regex)) {
                                        outputText += ' level">'; // .level in css --> padding-left: 15px;
                                        varScopeText += ' varScope">';
                                    }
                                } else if (level == 0) {
                                    // check if level is equals to 0
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
                                        // checks if output out of the captured groups from the regex is needed
                                        const currentNumber = varScopeAnswerArray[j].match(/^[0-9]*$/); // position on which regex is stored in database.json
                                        outputText += currentMatch[currentNumber]; // stores the text from "answer" in database.json to the outputText
                                    } else {
                                        // gets output from answer field in json
                                        outputText += varScopeAnswerArray[j]; // just adds answer text
                                    }
                                }

                                if (line.match(newVarComparisationRegex)) {
                                    // checks if inputtext is a declare boolean text --> loops through expressions to get the correct cg
                                    var answerArray;
                                    data.expressions.forEach(function (currentExpression) {
                                        if (currentMatch[4].match(currentExpression.regex)) {
                                            answerArray = currentExpression.answer;
                                            outputText = outputText.replace("expr", answerArray); // replace word expr in database.json with the correct value
                                        }
                                    });
                                }

                                if (dbline.name === "newVariableBitOperationRegex") {
                                    var bitOpExprAnswerArray;
                                    data.bitOperationExpression.forEach(function (currentExpression) {
                                        // loops over all expression objects from the json file
                                        if (currentMatch[4].match(currentExpression.regex)) {
                                            bitOpExprAnswerArray = currentExpression.answer; // split answer of print expression and stroe it in bitOpExprAnswerArray
                                            outputText = outputText.replace("operation", bitOpExprAnswerArray);
                                        }
                                    });
                                }

                                if (dbline.name === "newVariableLogicOperatorRegex") {
                                    var LogicOpExprAnswerArray;
                                    data.logicOperatorExpressions.forEach(function (currentExpression) {
                                        // loops over all expression objects from the json file
                                        if (currentMatch[4].match(currentExpression.regex)) {
                                            LogicOpExprAnswerArray = currentExpression.answer; // split answer of print expression and store it in LogicOpExprAnswerArray
                                            outputText = outputText.replace("logic", LogicOpExprAnswerArray);
                                        }
                                    });
                                }

                                if (dbline.name === "newVariableLogicOperatorNOTRegex") {
                                    var LogicOpNOTExprAnswerArray;
                                    data.logicOperatorExpressions.forEach(function (currentExpression) {
                                        // loops over all expression objects from the json file
                                        if (currentMatch[3].match(currentExpression.regex)) {
                                            LogicOpNOTExprAnswerArray = currentExpression.answer; // split answer of print expression and store it in LogicOpNOTExprAnswerArray
                                            outputText = outputText.replace("logic", LogicOpNOTExprAnswerArray);
                                        }
                                    });
                                }

                                //varScopeText += linelevel;
                                varScopeText += "</div>";
                                outputText += "</div>"; // code-block gets closed
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
                                    var height = "" + (value.lineLevelEnd - value.lineLevelStart); // * editorLineHeight; // calculate height and convert to string
                                    height += "px"; // add px (pixel) to height
                                    value.height = height; // height is assigned to height of current variable
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
                                    var height = "" + (value.lineLevelEnd - value.lineLevelStart); // * editorLineHeight; // calculate height and convert to string
                                    height += "px"; // add px (pixel) to height
                                    value.height = height; // height is assigned to height of current variable
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
                variableMap.forEach(function (value, key) {
                    // loops over all variables in map
                    if (value.blockLevel == 0) {
                        // checks if current variable has the blocklevel = 0
                        value.lineLevelEnd = linelevel; // actual linelevel is assigned to linelevelend of current variable
                        var height = "" + (value.lineLevelEnd - value.lineLevelStart + 1); // * editorLineHeight; // calculate height and convert to string
                        height += "px"; // add px (pixel) to height
                        value.height = height; // height is assigned to height of current variable
                    }
                });
                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////7
                // redeclare Variables
                data.redeclareVar.forEach(function (dbline) {
                    if (line.match(dbline.regex) && matched == false && isComment == false) {
                        // check if new Variable
                        var currentMatch = line.match(dbline.regex); // store cg in a new variable
                        var redeclarVarAnswerArray = dbline.answer.split("'"); // split answer and store in new array
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
                            countWhiteSpacesLine = wholeLineTxt.search(/\S/); // count whitespaces before first character of code
                            // add marker
                            aceEditor.session.addMarker(new Range(linelevel - 1, countWhiteSpacesLine, linelevel - 1, currentMatch[1].length + countWhiteSpacesLine), currentMatch[1], "text");

                            // create outputtext div with genereted keyoutput as id
                            outputText += "<div onclick=\"window.open('" + dbline.link + '\', \'_blank\'); event.stopPropagation();" style="cursor: pointer;" class="anyDiv ' + dbline.cssClasses;

                            if (level > 0 && dbline.keepLevel == "false") {
                                // check if level is bigger then 0 and if the code is indented
                                if (line.match(data.redeclareVar.regex)) {
                                    outputText += ' level">'; // .level in css --> padding-left: 15px;
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
                                    // checks if output out of the captured groups from the regex is needed
                                    const currentNumber = redeclarVarAnswerArray[j].match(/^[0-9]*$/); // position on which regex is stored in database.json
                                    outputText += currentMatch[currentNumber]; // stores the text from "answer" in database.json to the outputText
                                } else {
                                    // gets output from answer field in json
                                    outputText += redeclarVarAnswerArray[j]; // just adds answer text
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
                                outputText = outputText.replace("expr", answerArray); // replace word expr in database.json with the correct value
                            }
                            if (dbline.name === "redeclareVariableBitOperationRegex") {
                                var bitOpExprAnswerArray;
                                data.bitOperationExpression.forEach(function (currentExpression) {
                                    // loops over all expression objects from the json file
                                    if (currentMatch[3].match(currentExpression.regex)) {
                                        bitOpExprAnswerArray = currentExpression.answer; // split answer of print expression and store it in bitOpExprAnswerArray
                                        outputText = outputText.replace("operation", bitOpExprAnswerArray);
                                    }
                                });
                            }

                            if (dbline.name === "redeclareVariableLogicOperatorRegex") {
                                var LogicOpExprAnswerArray;
                                data.logicOperatorExpressions.forEach(function (currentExpression) {
                                    // loops over all expression objects from the json file
                                    if (currentMatch[3].match(currentExpression.regex)) {
                                        LogicOpExprAnswerArray = currentExpression.answer; // split answer of print expression and store it in LogicOpExprAnswerArray
                                        outputText = outputText.replace("logic", LogicOpExprAnswerArray);
                                    }
                                });
                            }

                            if (dbline.name === "redeclareVariableLogicOperatorNOTRegex") {
                                var LogicOpNOTExprAnswerArray;
                                data.logicOperatorExpressions.forEach(function (currentExpression) {
                                    //loops over all expression objects from the json file
                                    if (currentMatch[2].match(currentExpression.regex)) {
                                        LogicOpNOTExprAnswerArray = currentExpression.answer; // split answer of print expression and store it in LogicOpNOTExprAnswerArray
                                        outputText = outputText.replace("logic", LogicOpNOTExprAnswerArray);
                                    }
                                });
                            }

                            outputText += "</div>"; //code-block gets closed
                        }
                    }
                });

                ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                //call Method

                ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                //Stuff that doesnt get recognized by an array from the json file
                if (isComment == true) {
                    matched = true;
                    outputText += '<div onclick="event.stopPropagation();" style="cursor: default;" class="anyDiv unknown looksNice level">' + line + "\u200B</div>";
                }
                if (matched == false) {
                    if (level > 0 && line.match(/^\s*[a-zA-Z0-9]+/)) {
                        //checks if level is higher then 0 and if there is something typed that not gets recognized --> if so it highlights the text as red
                        outputText += '<div onclick="event.stopPropagation();" style="cursor: default;" class="anyDiv unknown-error looksNice level">' + line + "\u200B</div>"; // if nothing is typed in the line it will not highlight anything
                    } else if (level > 0) {
                        outputText += '<div onclick="event.stopPropagation();" style="cursor: default;" class="anyDiv unknown looksNice level">' + line + "\u200B</div>";
                    }
                    if (level == 0 && line.match(/^\s*[a-zA-Z0-9]+/)) {
                        //checks if the level is equals 0 and if there is something typed that not gets recognized --> if so it highlights the text as red
                        outputText += '<div onclick="event.stopPropagation();" style="cursor: default;" class="anyDiv unknown-error looksNice">' + line + "\u200B</div>"; //if nothing is typed in the line it will not highlight anything
                    } else if (level == 0) {
                        outputText += '<div onclick="event.stopPropagation();" style="cursor: default;" class="anyDiv unknown looksNice">' + line + "\u200B</div>";
                    }
                }
            });

            return outputText;
        };
    },
]);
