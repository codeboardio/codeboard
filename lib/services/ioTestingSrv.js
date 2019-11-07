/**
 * This is our custom service for doing input-output tests.
 *
 * @author Janick Michot
 *
 * @param projectId
 * @param files
 * @param options
 */
var config = require('../config/config.js'),
    http = require('http'),
    Promise = require('bluebird'),
    request = Promise.promisifyAll(require('request')), // use bluebird promises for requests
    mantraSrv = require('../services/mantraSrv.js');


/**
 * Output Test Strict
 * Compares whether the expected and actual output EXACTLY match (Character by Character).
 * @param output
 * @param expectedOutput
 * @returns {boolean}
 */
let checkOutputStrict = function(output, expectedOutput) {
    return (output === expectedOutput);
};

/**
 * Output Test Flexible
 * Compares whether the expected and actual output match while IGNORING whitespace, case, and special character difference.
 * @param output
 * @param expectedOutput
 * @returns {boolean}
 */
let checkOutputFlexible = function(output, expectedOutput) {

    // remove special chars and spaces from both actual and expected output
    output = output.replace(/[\\$'"]/g, "\\$&").replace(/\s/g, '');
    expectedOutput = expectedOutput.replace(/[\\$'"]/g, "\\$&").replace(/\s/g, '');

    console.log(output);
    console.log(expectedOutput);

    return (output === expectedOutput);
};

/**
 * Output Test Regex
 * Check output using Regular Expressions to match against the student's output.
 * @param output
 * @param regex
 * @returns {boolean}
 */
var checkOutputRegex = function(output, regex) {

    // check if regex is valid
    let isRegexValid = true;
    try {
        regex = new RegExp(regex);
    } catch (e) {
        isRegexValid = false;

        console.log("Regex ist invalid"); // todo was machen, wenn regex invalid?
    }

    return (isRegexValid && regex.test(output));
};


/**
 * Escapes a string from all three types of line breaks
 * @param string
 * @param replaceWith
 * @returns {*}
 */
let escapeFromLineBreaks = function(string, replaceWith = " ") {
    return string.replace(/(\r\n|\n|\r)/gm, replaceWith);
};


/**
 * Converts a string with linebreaks to an array
 * This functions uses our string escape function in order to catch all types of line breaks
 * @param string
 * @returns {*}
 */
let stringWithLineBreaksToArray = function(string) {
    string = escapeFromLineBreaks(string, "|");
    return string.split("|");
};

/**
 * Converts an array to a string with linebreaks
 * If array is empty, this functions returns a string contains a single linebreak
 * @param array
 * @param lineBreak
 * @returns {string}
 */
let arrayToStringWithLineBreaks = function(array, lineBreak = '\n') {
    return (array.length > 0) ? array.join(lineBreak) + lineBreak : lineBreak;
};


/**
 * Input Output Matching (janick)
 * @param data {object} contains the files and a property "language"
 * @returns {*|Promise} a bluebird promise
 */
var test = function (data) {

    // the new Mantra needs to know that we don't want a WS stream
    data.stream = false;

    // set data.action to compile in order to get compilationErrors
    data.action = "run";

    // array containing all appropriate output-tests for the given output
    let appropriateTests = [];

    // do io-test asynchronously one after another
    return data.ioTests.reduce((promiseChain, ioTest) => {

        // Note, Promise.resolve() resolve is our initial value
        return promiseChain.then(function () {

            // set input for this run
            data.input = arrayToStringWithLineBreaks(ioTest.inputs);

            return mantraSrv.compile(data)
                .then(function (executionResult) {

                    // todo compilation fehler ermitteln
                    // anders als beim Submiten, erhalten wir hier nicht eine Meldung über einen CompilationFehler,
                    // sondern einfach den output. Entweder Mantra anpassen oder Fehler aus Output lesen...
                    // oder allenfalls auch möglich durch anpassen der Parameter an Mantra
                    console.log(executionResult);

                    // todo wird compilation nicht schon als error zurückgegeben von compile?
                    // stop execution when an compilation error occurs
                    if (executionResult.compilationError) {
                        return Promise.reject('Compilation Error'); // bricht aber nur aktuellen Test und nicht alle ab..
                    }

                    // get input and output data
                    let output = executionResult.output,
                        input = data.input;

                    // todo muss das hier passieren, ist das nich abhängig davon ob Array oder String
                    // NOTE: Every returned output-string contains all input values at the beginning.
                    // That's why we need to remove this values
                    input = escapeFromLineBreaks(input);
                    output = escapeFromLineBreaks(output).replace(input, '');

                    console.log(output);

                    // test-loop for each output defined
                    for (let i = 0; i < ioTest.outputs.length; i++) {

                        // get the test
                        let testCase = ioTest.outputs[i];

                        let isOutputMatching;
                        switch (testCase.type) {
                            case "strict":
                                isOutputMatching = checkOutputStrict(output, testCase.output);
                                break;
                            case "flexible":
                                isOutputMatching = checkOutputFlexible(output, testCase.output);
                                break;
                            case "regex":
                                isOutputMatching = checkOutputRegex(output, testCase.output);
                                break;

                            // todo separate functions erstellen für die Behandlung von Arrays
                            // case 'arrayLineByLineStrict':    = jeder Wert aus dem Array muss 1 zu 1 stimmen
                            // case 'arrayLineByLineFlexible':  = jeder Wert aus dem Array muss flex stimmen
                            // case 'arrayLineByLineRegex':     = jeder Wert muss dem entsprechenden Regex entsprechen
                            // case 'arrayStrict':              = Array muss strikt Werte enthalten, wo im Array egal
                            // case 'arrayFlexible':            = Array muss flex Werte enthalten, wo im Array egal
                            // case 'arrayRegex':               = Array muss Werte enthalten, die regex erfüllen, wo egal
                        }

                        // if a test is appropriate return testCase. By returning a testCase we leave the loop
                        if(isOutputMatching) {
                            return testCase;
                        }
                    }

                    return Promise.resolve("Kein Test zugetroffen");

                    // todo was passiert, wenn kein Test zutrifft.. fehler muss irgendow gecatcht werden
                    // return Promise.reject(new Error('Fehler bei der Überprüfung. Bitte wende dich an den Kursleiter.. Kein Output trifft zu'));

                }).then(function (testCase) {
                    // add test to the array and return the array
                    appropriateTests.push(testCase);
                    return appropriateTests;
                });
        });
    }, Promise.resolve())

        .then(function (appropriateTests) {
            console.log(JSON.stringify(appropriateTests));

            // count passed and failed tests and add notes to the output
            data.output = "";
            let numTestsFailing = 0, numTestsPassing = 0, i = 1;
            appropriateTests.forEach(function(test) {
                if(test.pass) {
                    numTestsPassing++;
                } else {
                    numTestsFailing++;
                }
                data.output += "Test " + i + ": " + test.note + "\n";
                i++;
            });

            data.numTestsFailing = numTestsFailing;
            data.numTestsPassing = numTestsPassing;

            return data;
        })
        .catch(function (err) {

            // todo wo Fehler behandeln? hier order projecCtrl?
            console.log(err);

        });
};




exports.test = test;