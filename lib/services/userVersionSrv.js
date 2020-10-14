/**
 * Service used to store different user versions.
 * The primary use of this service is to store the users version
 * on compilation errors. This data is then used in the context of an students work
 * to evaluate and develop improved automatic assistance.
 *
 * @author Janick Michot
 * @date 08.10.2020
 */

'use strict';

const { UserVersion } = require('../models');
const projectSrv = require('./projectSrv');
const bluebird = require('bluebird');
const { postAsync } = bluebird.promisifyAll(require('request'));


/**
 * Saves the input together with the corresponding output to the database.
 * This function is called if a compilation error occurs.
 * * We store the hidden files to guarantee the user version is exactly as it was when a student submitted
 *
 * @param userId
 * @param projectId
 * @param filesInDefaultFormat
 * @param output
 * @param status
 */
let storeUserVersionOnCompilationError = function(projectId, userId, filesInDefaultFormat, output, status = 'compilationError') {

    // first we load all the hidden files that belongs to this project
    projectSrv.getAllHiddenFilesOfProject(projectId, false)
        .then(function (hiddenFileSet) {
            // create the user version record
            return UserVersion.create( {
                type: 'compilation',
                status: status,
                output: JSON.stringify(output),
                userFilesDump: JSON.stringify(filesInDefaultFormat),
                hiddenFilesDump: JSON.stringify(hiddenFileSet),
                projectId: projectId,
                userId: userId
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
 * Example request for the compilation message service (Integrations-Projekt von Studenten)
 * @param projectId
 * @param filesInDefaultFormat
 * @param output
 */
let exampleRequestForCompilationMessageService = function (projectId, filesInDefaultFormat, output) {
    projectSrv.getAllHiddenFilesOfProject(projectId, false)
        .then(function (hiddenFileSet) {

            return postAsync({url: 'https://codeboard-test.sml.zhaw.ch/api/getCompilationErrorMessage', json: true, headers: {}, body: {
                files: JSON.stringify(projectSrv.getCombinedFiles(hiddenFileSet, filesInDefaultFormat)),
                error: output
            }})
                .then((result, body) => {
                    // todo
                    console.log(result.body);
                    return result;
                })
                .catch(err => {
                    console.log("Error creating compilation error message: " + err);
                });
        })
        .catch(err => {
           console.log(err);
        });
};



exports.storeUserVersionOnCompilationError = storeUserVersionOnCompilationError;
exports.exampleRequestForCompilationMessageService = exampleRequestForCompilationMessageService;


