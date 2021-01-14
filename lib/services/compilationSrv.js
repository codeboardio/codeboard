/**
 * Service used to compile a project.
 * The primary use of this service is to store the users version.
 * on compilation errors. This data is then used in the context of an students work
 * to evaluate and develop improved automatic assistance.
 *
 * @author Janick Michot
 * @date 08.10.2020
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { CompilationError, User, Project, Course } = require('../models');
const projectSrv = require('./projectSrv');
const mantraSrv = require('./mantraSrv');
const bluebird = require('bluebird');
const { postAsync, getAsync } = bluebird.promisifyAll(require('request'));
const config = require('../config/config.js');
const errAndExcHelpSrv = require('./errAndExcHelpSrv');


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
 * Extracts the number of errors at the end of an compilation error
 * @param output
 * @returns {any}
 */
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
 * Output Test Regex
 * Check output using Regular Expressions to match against the student's output.
 * todo nach Integration LÖSCHEN
 * @param output
 * @param regex
 * @param maxOutputLength
 * @returns {boolean}
 */
let checkOutputRegex = function(output, regex, maxOutputLength = 2000) {

    // we try to prevent "Maximum call stack size exceeded" by
    // limiting the output size to 2000 characters
    if(output.length > maxOutputLength) {
        console.log(`Output ${output.length} exceeds max output length of ${maxOutputLength} and will therefore not be checked with regex`);
        return false;
    }

    // todo prevent maximum call stack size exceeded

    // check if regex is valid
    let isRegexValid = true;
    try {
        regex = new RegExp(regex);
    } catch (e) {
        isRegexValid = false;
        console.log(`Regex is not valid: ${regex}`);
    }

    return (isRegexValid && regex.test(output));
};

/**
 * Saves the input together with the corresponding output to the database.
 * This function is called if a compilation error occurs.
 * We store the hidden files to guarantee the user version is exactly as it was when a student submitted
 *
 * @param userId
 * @param projectId
 * @param courseId
 * @param filesInDefaultFormat
 * @param output
 */
let createCompilationError = function(projectId, userId, courseId, filesInDefaultFormat, output) {

    // when old js is cached it may be that the file set is empty
    if(typeof filesInDefaultFormat === "undefined") {
        Promise.reject("Files not found");
    }

    // get all non-hidden files (static is ok)
    const userFilesDump = filesInDefaultFormat.filter(file => !file.isFolder && !file.isHidden).map(file => {
        return { filename: file.path + '/' + file.filename, content: file.content };
    });

    // first we load all the hidden files that belongs to this project
    return projectSrv.getAllHiddenFilesOfProject(projectId, false)
        .then(function (hiddenFileSet) {
            // create the user version record
            return CompilationError.create( {
                output: JSON.stringify(output),
                userFilesDump: JSON.stringify(userFilesDump),
                hiddenFilesDump: JSON.stringify(hiddenFileSet),
                projectId: projectId,
                userId: userId,
                courseId: courseId,
                responseMessage: ""
            });
        })
        .then(function(userVersion) {
            return(userVersion);
        })
        .catch(function(err) {
            console.log("Error while storing user version:" + err);
        });
};

/**
 * Takes a compilation error and adds the response message
 * @param compilationError
 * @param responseMessage
 */
let compilationErrorAddResponse = function(compilationError, responseMessage) {
    compilationError.responseMessage = responseMessage;
    return compilationError.save();
};


/**
 * The old help for compilation errors.
 * todo nach Integration LÖSCHEN
 */
let simpleCompilationErrorMessage = function(compilationError, outputArray, language) {

    let compileTests = [];

    // read language specific compilation tests
    let filePath = path.join(__dirname, '/../config/compile_tests/' + language  + '/compileTests.json');

    // if file exists load compilationTests
    if(fs.existsSync(filePath)) {
        // do the parsing inside a try and catch block to check for json validity
        try {
            let compilationConfig = JSON.parse(fs.readFileSync(filePath));
            compileTests = compilationConfig.compTests;
        } catch (e) {
            return Promise.reject("Compile tests not found");
        }
    }

    // loop trough all compile tests and return the note of the first matching rule
    if(compileTests.length > 0) {
        compileTests.forEach(function (test) {
            // check with regex on basis of a segment
            for (let i = 0; i < outputArray.length; i++) {
                if (checkOutputRegex(escapeFromLineBreaks(outputArray[i]), test.error)) {
                    return Promise.resolve(test.note);
                }
            }
        });
    }

    // if no specific help was found, return generic message
    return Promise.resolve("Dein Code konnte nicht kompiliert werden. Versuche die untenstehende Fehlermeldung zu verstehen.");
};


/**
 * Example request for the compilation message service (Integrations-Projekt von Studenten)
 * @param aCompilationError
 * @param outputArray
 */
let newCompilationErrorMessage = function (aCompilationError, outputArray) {

    const compilationErrorServiceUrl = config.compilationErrorSrv;

    // an array holding all the promise used for the comp message request
    let promises = [];

    // get username
    promises.push(
        User.findByPk(aCompilationError.userId, { attributes: ['id', 'username', 'name'] })
    );

    // get project
    promises.push(
        Project.findByPk(aCompilationError.projectId, { attributes: ['id', 'projectname'] })
    );

    // get course
    promises.push(
        Course.findByPk(aCompilationError.courseId, { attributes: ['id', 'coursename'] })
    );

    // promise all and return project id
    return Promise.all(promises)
        .then(function([user, project, course]) {

            // replace tabs with ' '
            outputArray = outputArray.map(x => x.replace('\t', ' '));

            const _body = {
                    files: aCompilationError.userFilesDump,
                    error: outputArray,
                    user: user,
                    project: project,
                    course: course
            };

            const postData = {
                url: compilationErrorServiceUrl,
                json: true,
                headers: {},
                body: _body
            };

            return getAsync(postData)
                .then((result) => {
                    return result.body;
                })
                .catch(err => {
                    console.log("Error creating compilation error message: " + err);
                });
    });
};


/**
 * This method defines what happens when a compilation error occurs.
 * At the moment this method is only used for compilations without websocket. So. data.stream = false
 *
 * @param aCompilationError
 * @param data
 */
let onCompilationError = function(aCompilationError, data) {

    // todo wie gestalten wir das?
    return errAndExcHelpSrv.getHelpForOutput(aCompilationError.output, data)
        .then(function(msg) {
            aCompilationError.compErrorHelpMessage =  msg;
            return aCompilationError;
        });

    return createCompilationError(data.projectId, data.userId, data.courseId, data.filesInDefaultFormat, aCompilationError.output)
        .then(compilationError => {

            if(compilationError) {

                let compMessagePromise;
                let compOutputArray = compilationOutputSeparation(aCompilationError.output) || [aCompilationError.output]; // todo actually language specific

                // todo randomly generate new and old help to evaluate the automatic assistance
                let randomInt = 0; // Math.floor(Math.random() * 2);
                if(randomInt === 0) {
                    // compMessagePromise = newCompilationErrorMessage(compilationError, compOutputArray);
                    compMessagePromise = newCompilationErrorMessage(aCompilationError, compOutputArray);
                } else {
                    compMessagePromise = simpleCompilationErrorMessage(compilationError, compOutputArray, data.language);
                }

                // resolve promise and return the compilation error
                return compMessagePromise
                    .then(function(compilationErrorResponse) {
                        compilationErrorAddResponse(compilationError, compilationErrorResponse);
                        aCompilationError.compErrorHelpMessage =  compilationErrorResponse;
                        aCompilationError.compilationErrorId =  compilationError.id;
                        return aCompilationError;
                    })
                        .catch((err) => {
                            return simpleCompilationErrorMessage(compilationError, compOutputArray, data.language)
                                .then(function(compilationErrorResponse) {
                                    compilationErrorAddResponse(compilationError, compilationErrorResponse);
                                    aCompilationError.compErrorHelpMessage =  compilationErrorResponse;
                                    aCompilationError.compilationErrorId =  compilationError.id;
                                    return aCompilationError;
                                });
                        });
            }
        })
        .catch(err => {
            console.log(err);
            return null;
        });
};

/**
 * Updates a compilationErrorRecord in order to set a rating
 * @param compilationErrorId
 * @param rating
 * @returns {*}
 */
let rateCompilationErrorMessage = function(compilationErrorId, rating) {
    return CompilationError.update({
        rating: rating
    }, {
        where: { id: compilationErrorId}
    });
};


/**
 * Compile project by calling the mantra srv.
 * This function should not change the compile result.
 * Additional functions are or can be implemented here.
 * @param data
 */
let compile = function(data) {
    return mantraSrv.compile(data)
        .then(function(compResult) {

            if (compResult.compilationError && data.stream === false) {
                return onCompilationError(compResult, data)
                    .catch(function(err) {
                        console.log("Error compiling: " + err);
                    });
            }

            return compResult;
        });
};


exports.compile = compile;
exports.rateCompilationErrorMessage = rateCompilationErrorMessage;

