/**
 * This is our custom service for doing input-output tests.
 *
 * @author Janick Michot
 *
 * @param projectId
 * @param files
 * @param options
 */
const config = require('../config/config.js'),
      http = require('http'),
      fs = require('fs'),
      path = require('path'),
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
    return string.replace(/(\r\n|\n|\r)/gm, replaceWith).trim();
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
    return (Array.isArray(array)) ? array.join(lineBreak) + lineBreak : lineBreak;
};



/**
 * todo separate functions erstellen für die Behandlung von Arrays:
 *  case 'arrayLineByLineStrict':    = jeder Wert aus dem Array muss 1 zu 1 stimmen
 *  case 'arrayLineByLineFlexible':  = jeder Wert aus dem Array muss flex stimmen
 *  case 'arrayLineByLineRegex':     = jeder Wert muss dem entsprechenden Regex entsprechen
 *  case 'arrayStrict':              = Array muss strikt Werte enthalten, wo im Array egal
 *  case 'arrayFlexible':            = Array muss flex Werte enthalten, wo im Array egal
 *  case 'arrayRegex':               = Array muss Werte enthalten, die regex erfüllen, wo egal
 */
let ioMatching = function(actualOutput, ioTests) {

    // test-loop for each output defined
    for (let i = 0; i < ioTests.length; i++) {

        // get the test
        let testCase = ioTests[i], isOutputMatching;

        switch (testCase.type) {
            case "strict":
                isOutputMatching = checkOutputStrict(actualOutput, testCase.matching);
                break;
            case "flexible":
                isOutputMatching = checkOutputFlexible(actualOutput, testCase.matching);
                break;
            case "regex":
                isOutputMatching = checkOutputRegex(actualOutput, testCase.matching);
                break;
        }

        if(isOutputMatching) {
            return testCase;
        }
    }

    return false; // no hit
};


/**
 *
 * @param data
 */
let ioTestSingle = function(data) {

    // store input
    let input = data.testData.input;

    // get the test data
    let testData = data.testData;

    // the new Mantra needs to know that we don't want a WS stream
    data.stream = false;

    // set data.action to run
    data.action = (data.language !== 'Java') ? "compile" : "run";

    // we need input as an array
    data.input = (typeof data.input === "string") ? stringWithLineBreaksToArray(input) : input;

    // run code and call io function. Return the result
    return mantraSrv.executeCommand(data)
        .then(function (executionResult) {
            testData.id = executionResult.id; // keep previous execution id
            testData.output = executionResult.output;
            testData.result = ioMatching(executionResult.output, testData.tests);

            if(testData.result) {
                testData.status = (testData.result.pass) ? 'success' : 'fail';
            } else {
                testData.status = 'ignored';
            }
            return testData;
        });
};


/**
 * Input Output Matching (not tested yet -> use ioTestSingle)
 * @param data {object} contains the files and a property "language"
 * @returns {*|Promise} a bluebird promise
 */
let ioTestArray = function (data = []) {

    // get the test data
    let testData = data.testData;

    // the new Mantra needs to know that we don't want a WS stream
    data.stream = false;

    // set data.action to run
    data.action = (data.language !== 'Java') ? "compile" : "run";

    // do io-test asynchronously one after another
    return testData.reduce((promiseChain, test) => {

        // Note, Promise.resolve() resolve is our initial value
        return promiseChain.then(function () {

            // set input for this run
            data.input = (typeof data.input === "string") ? stringWithLineBreaksToArray(data.testData.input) : data.testData.input;

            // run code and call io function. Return the result
            return mantraSrv.executeCommand(data)
                .then(function (executionResult) {
                    test.id = executionResult.id; // keep previous execution id
                    test.result = ioMatching(executionResult.output, test.tests, test.input);
                    test.output = executionResult.output;
                    test.status = (test.result.pass) ? 'success' : 'fail';
                    return test;
                });
        });
    },
    Promise.resolve()
    )
    .then(function () {
        return testData;
    });
};


let javaCompilationOutputGetNumErrors = function (output) {
    output = escapeFromLineBreaks(output);
    let regex = new RegExp('\\d+(?= errors?)', 'g'),
        result = output.match(regex);
    return (result && typeof result[0] !== 'undefined') ? parseInt(result[0]) : false;
};


/**
 * Using regex, this function separates the output of a compilation into the individual errors.
 *
 * NOTE: as we currently only offer Java (as a non-dynamic programming language), we can do the
 * segmentation here. Otherwise it would be better to do this on Mantra's side by adding such
 * a function to the each language file. The segmentation of the outputs depends on the
 * programming language.
 *
 * @param output string
 * @returns {*}
 */
let compilationOutputSeparation = function (output) {
    // this regex matches until next occurrence of `./File/Name.java:x:` or end of compilation error by using positive lookahead
    let regex = new RegExp('.+?(?=(\\.[A-Za-z/]+.java:\\d+:)|(\\d+ errors?$))', 'g');

    // escape output from any line breaks to make regex easier
    output = escapeFromLineBreaks(output);

    // regex match
    let outputArray = output.match(regex);

    // check if segmentation is correct, by comparing length with numErrors at the end of an compilation error
    if(outputArray.length !== javaCompilationOutputGetNumErrors(output)) {
        return [];
    }
    return outputArray;
};


/**
 *
 * @param data
 * @returns {Promise}
 */
let compileTest = function (data) {

    // get the test data
    let testData = data.testData;

    // the new Mantra needs to know that we don't want a WS stream
    data.stream = false;

    // set data.action to run in order to get compilation errors
    data.action = "compile";

    return mantraSrv.compile(data)
        .then(function (compResult) {

            testData.output = compResult.output;
            testData.id = compResult.id;
            testData.status = 'success';

            if (compResult.compilationError) {
                testData.status = 'fail';
                testData.outputArray = (data.language === 'Java') ? compilationOutputSeparation(compResult.output) : [testData.output];
                testData.numErrors = javaCompilationOutputGetNumErrors(compResult.output);

                // do the compilation tests
                testData.tests.forEach(function(test) {
                    // check with regex on basis of a segment
                    for (let i = 0; i < testData.outputArray.length; i++) {
                        if(checkOutputRegex(escapeFromLineBreaks(testData.outputArray[i]), test.error)) {
                            testData.result.push(test); break;
                        }
                    }
                });
            }
            return testData;
        })
        .catch( function(error) {
            console.log(error);
        });
};


/**
 * NOTE: unitTests wurden bislang über den Diest Kali gmacht. Damit künftig wiede
 * unitTests gemacht werden können, muss Kali in Mantra integriert werden.
 */
let unitTest = function() {

};


/**
 * This method loads all tests. To do so, the configuration file is read and
 * the programming language is taken into account.
 *
 * NOTE: must return an object (array not allowed!?)
 */
let getTests = function(data) {

    let testData = {
        tests: [],
        msg: '',
        onSuccess: '',
        useCompileTests: true,
        fail: false
    };

    // read codeboard.json
    let configFile = data.files.find(file => file.filename === 'Root/codeboard.json'),
        codeboardConfig = {};

    try {
        codeboardConfig = JSON.parse(configFile.content);
    } catch (e) {
        testData.msg = "Fehler in der Config-Datei";
        testData.fail = true;
        return testData;
    }

    // check if codeboard.json contains testing
    if(!codeboardConfig.Testing) {
        return false;
    }

    // read test data
    let testing = codeboardConfig.Testing;
    testData.useCompileTests = testing.useCompileTests || testData.useCompileTests;
    testData.onSuccess = testing.onSuccess || testData.onSuccess;
    testData.ioTests = testing.ioTests;

    // prepare compilation test settings
    if(testData.useCompileTests) {

        // read language specific compilation tests
        let filePath = path.join(__dirname, '/../config/compile_tests/' + data.language  + '/compileTests.json');

        // if file exists load compilationTests
        if(fs.existsSync(filePath)) {
            let compilationConfig = JSON.parse(fs.readFileSync(filePath));
            testData.tests.push(Object.assign({
                'name': 'Überprüfung Kompilierung',
                'method': 'compileTest',
                'status': 'pending',
                'tests': [], // todo compile test daten von zentralem File laden
                'result': [],
                'output': '',
                'stopOnFailure': true,
                'id': '' // last compilation id
            }, compilationConfig.compTests));
        }
    }

    // prepare ioTests (received from codeboard.json) settings
    if(testData.ioTests.length > 0) {
        testData.ioTests.forEach(function (ioTest) {
            testData.tests.push( Object.assign({
                'name': '',
                'method': 'ioTest',
                'status': 'pending', // fail | success
                'input': '\n',
                'tests': [],
                'result': {},
                'output': '',
                'stopOnFailure': false,
                'id': ''
            }, ioTest) );
        });
    }

    // todo weitere tests hinzufügen (unit usw)

    return testData;
};


/**
 * todo diese funktion soll vollautmatisch alle tests laden, ausführen und ein Resultat zurückschicken
 *
 */
let doTests = function (data) {

    // load all tests
    let testData = getTests(data);

    // reject promise when something went wrong
    if (testData.fail) {
        Promise.reject("Fehlgeschlagen: " + data.msg);
    }

    // do io-test asynchronously one after another
    let i = 0, appropriateTests = [];
    return testData.tests.reduce((promiseChain, test) => {

        // Note, Promise.resolve() resolve is our initial value
        return promiseChain.then(function (id) {

            // dont make any further tests after `stopOnFailure`
            if (i > 0 && id === 0) {
                test.status = "unreachable";
                appropriateTests[i] = test; i++;
                return 0;
            }

            // set compilation/run id from last call
            test.id = id;

            // set testData for this run
            data.testData = test;

            // switch testMethod and call corresponding function
            switch (test.method) {
                case 'compileTest':
                    return compileTest(data)
                        .then(function (testResult) {
                            appropriateTests[i] = testResult;
                            i++;
                            return (testResult.stopOnFailure && testResult.status === 'fail') ? 0 : testResult.id;
                        });

                case 'ioTest':
                    return ioTestSingle(data)
                        .then(function (testResult) {
                            appropriateTests[i] = testResult;
                            i++;
                            return (testResult.stopOnFailure && testResult.status === 'fail') ? 0 : testResult.id;
                        });

                default:
                    return Promise.resolve();
            }
        });
    }, Promise.resolve() )
        .then(function () {
            // return all tests
            return appropriateTests;
        })
        .catch(function (error) {
            console.log(error);
        });

};


exports.ioTestSingle = ioTestSingle;
exports.compileTest = compileTest;
exports.unitTest = unitTest;
exports.getTests = getTests;
exports.doTests = doTests;