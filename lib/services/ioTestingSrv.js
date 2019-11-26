/**
 * This is our custom service for doing input-output tests.
 *
 * @author Janick Michot
 *
 * @param projectId
 * @param files
 * @param options
 */
let config = require('../config/config.js'),
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
let ioMatching = function(actualOutput, ioTests, input) {

    // NOTE: Every returned output-string contains all input values at the beginning.
    // That's why we need to remove this values
    input = escapeFromLineBreaks(input);
    actualOutput = escapeFromLineBreaks(actualOutput).replace(input, '');

    // test-loop for each output defined
    for (let i = 0; i < ioTests.length; i++) {

        // get the test
        let testCase = ioTests[i], isOutputMatching;

        switch (testCase.type) {
            case "strict":
                isOutputMatching = checkOutputStrict(actualOutput, testCase.output);
                break;
            case "flexible":
                isOutputMatching = checkOutputFlexible(actualOutput, testCase.output);
                break;
            case "regex":
                isOutputMatching = checkOutputRegex(actualOutput, testCase.output);
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

    // input array to string
    data.testData.input = arrayToStringWithLineBreaks(data.testData.input); // todo wird möglichweise ersetzt wenn "line by line"-Überprüfung implementiert wird

    // get the test data
    let testData = data.testData;

    // the new Mantra needs to know that we don't want a WS stream
    data.stream = false;

    // set data.action to run
    data.action = (data.language !== 'Java') ? "compile" : "run";

    // set input for this run
    data.input = data.testData.input;

    // run code and call io function. Return the result
    return mantraSrv.executeCommand(data)
        .then(function (executionResult) {
            testData.id = executionResult.id; // keep previous execution id
            testData.result = ioMatching(executionResult.output, testData.tests, testData.input);
            testData.output = executionResult.output;
            testData.status = (testData.result.pass) ? 'success' : 'fail';
            return testData;
        });
};


/**
 * Input Output Matching (janick)
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
            data.input = arrayToStringWithLineBreaks(test.input);

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
            testData.status = (compResult.compilationError) ? 'fail' : 'success';
            testData.id = compResult.id;

            if(compResult.compilationError) {
                testData.tests.forEach(function(test) {
                    if(checkOutputRegex(compResult.output, test.error)) {
                        testData.result.push(test);
                    }
                });
            }
            return testData;
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

    let result = {tests: [], msg: '', fail: false};

    let configFile = data.files.find(file => file.filename === 'Root/codeboard.json'), config = {};
    try {
        config = JSON.parse(configFile.content);
    } catch (e) {
        result.msg = "Fehler in der Config-Datei";
        result.fail = true;
        return result;
    }

    // add compile tests if required
    if(data.language === 'Java' && config.checkCompilation !== false) {

        // overwrite default settings with data from codeboard.json and add it to the test array
        result.tests.push( Object.assign({
            'name': 'Überprüfung Kompilierung',
            'method': 'compileTest',
            'status': 'pending',
            'tests': [], // todo compile test daten von zentralem File laden
            'result': [], // this is where the result will be written in later. Multiple values possible
            'output': '', // this is where the output will be written in later
            'stopOnFailure': true,
            'id': '' // last compilation id
        }, config.compTests));

    }

    // add ioTests
    if(config.ioTests.length > 0) {
        config.ioTests.forEach(function (ioTest) {

            // overwrite default settings with data from codeboard.json and add each ioTest to the test array
            result.tests.push( Object.assign({
                'name': '',
                'method': 'ioTest',
                'status': 'pending', // fail | success
                'input': '\n',
                'tests': [],
                'result': {}, // this is where the result will be written in later. Only single value possible
                'output': '',
                'stopOnFailure': false,
                'id': ''
            }, ioTest) );
        });
    }

    // todo weitere tests hinzufügen (unit usw)

    return result;
};



exports.ioTestArray = ioTestArray;
exports.ioTestSingle = ioTestSingle;


exports.compileTest = compileTest;
exports.unitTest = unitTest;
exports.getTests = getTests;