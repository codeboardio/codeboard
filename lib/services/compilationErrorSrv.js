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

const { CompilationError, User, Project, Course } = require('../models');
const projectSrv = require('./projectSrv');
const bluebird = require('bluebird');
const { postAsync } = bluebird.promisifyAll(require('request'));
const config = require('../config/config.js');


/**
 * Saves the input together with the corresponding output to the database.
 * This function is called if a compilation error occurs.
 * * We store the hidden files to guarantee the user version is exactly as it was when a student submitted
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
        return;
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
 * Example request for the compilation message service (Integrations-Projekt von Studenten)
 * @param aCompilationError
 */
let exampleRequestForCompilationMessageService = function (aCompilationError) {

    const compilationErrorServiceUrl = config.host + '/api/getCompilationErrorMessage';

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

            const postData = {
                url: compilationErrorServiceUrl,
                json: true,
                headers: {},
                body: {
                    files: aCompilationError.userFilesDump,
                    error: aCompilationError.output,
                    user: user,
                    project: project,
                    course: course
                }
            };

            return postAsync(postData)
                .then((result, body) => {
                    // todo
                    console.log(result.body);
                    return result;
                })
                .catch(err => {
                    console.log("Error creating compilation error message: " + err);
                });
    });

};


/**
 * This function gets called when an compilation error occurs
 * @param projectId
 * @param userId
 * @param courseId
 * @param filesInDefaultFormat
 * @param output
 */
let onCompilationError = function(projectId, userId, courseId, filesInDefaultFormat, output) {
    createCompilationError(projectId, userId, courseId, filesInDefaultFormat, output)
        .then(compilationError => {
            if(compilationError) {
                // send compilationError error to the compilation error service
                exampleRequestForCompilationMessageService(compilationError)
                    .then(response => {
                        // todo update userVersion
                        return response;
                    });
            }
        });
};


exports.onCompilationError = onCompilationError;
exports.createCompilationError = createCompilationError;
exports.exampleRequestForCompilationMessageService = exampleRequestForCompilationMessageService;

