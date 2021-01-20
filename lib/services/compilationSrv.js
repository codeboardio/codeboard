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
 * This method defines what happens when a compilation error occurs.
 * At the moment this method is only used for compilations without websocket. So. data.stream = false todo
 *
 * @param aCompilationError
 * @param data
 */
let onCompilationError = function(aCompilationError, data) {
    if(!aCompilationError.compilationError) return Promise.resolve(aCompilationError);

    const storeCompilation = config.storeCompilationErrors;

    console.log(data.userId);

    const output = (typeof aCompilationError.compilationOutputArray !== "undefined") ? aCompilationError.compilationOutputArray : aCompilationError.output;

    // resolve the promise and return the compilation error. If `storeCompilation` store the compilation error.
    return errAndExcHelpSrv.getHelpForCompilationErrors(output, data.language, data.courseId, data.userId)
        .then(function(msg) {
            console.log(msg);
            aCompilationError.compErrorHelpMessage =  msg;
            if(storeCompilation) {
                return createCompilationError(data.projectId, data.userId, data.courseId, data.filesInDefaultFormat, aCompilationError.output)
                    .then(compilationError => {
                        aCompilationError.compilationErrorId =  compilationError.id;
                        return aCompilationError;
                    });
            } else {
                return aCompilationError;
            }
        })
            .catch(function(err) {
                console.log(err);
               return aCompilationError;
            });
};

/**
 * Updates a compilationErrorRecord in order to set a rating
 * todo in errAndExcHelpSrv verschieben
 * @param compilationErrorId
 * @param rating
 * @returns {*}
 */
let rateCompilationErrorMessage = function(compilationErrorId, rating) {
    if(!config.storeCompilationErrors) return false;
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
                        console.log(err);
                    });
            }
            return compResult;
        });
};


exports.compile = compile;
exports.rateCompilationErrorMessage = rateCompilationErrorMessage;

