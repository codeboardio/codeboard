/**
 *
 * @author Janick Michot
 * @date 27.12.2019
 */

const { ChatLine, User, HelpRequest, Course, Project } = require('../models');
const userSrv = require('../services/userSrv.js');
const mailSrv = require('../services/mailSrv.js');


/**
 * Return chatline with user and author included
 *
 * @param chatLineId
 * @returns {void|Query|Promise<Model | null>|Promise<Model>}
 */
let getChatLine = function(chatLineId) {

    return ChatLine.findOne({
        where: { id: chatLineId },
        include: [
            { model: User, as: 'user', attributes: ['username', 'name', 'email', 'emailPublic'] },
            { model: User, as: 'author', attributes: ['username'] },
            { model: HelpRequest, as: 'subject', required: false, attributes: ['status'], include: [
                { model: Course, as: 'course', attributes: ['id', 'coursename'] }
            ]},
            { model: Project, as: 'project', attributes: ['projectname'] }
        ]
    });
};


/**
 * Returns all chatlines for user and project
 *
 * @param username
 * @param projectId
 */
let getChatLines = function(username, projectId) {

    return userSrv.getUser(username)
        .then( function(projectUser) {
            return ChatLine.findAll({
                where: {
                    userId: projectUser.id,
                    projectId: projectId
                },
                include: [
                    { model: User, as: 'user', attributes: ['username', 'name'] },
                    { model: User, as: 'author', attributes: ['username', 'name'] },
                    { model: HelpRequest, as: 'subject', attributes: ['status'] }
                ]
            });
        });
};

/**
 * Creates a new chatline
 *
 * @param user
 * @param projectId
 * @param options obj{author, message, messageType, helpRequestId}
 * @returns {*}
 */
let addChatLine = function(user, projectId, options = {}) {

    // create promises
    let getAuthor = userSrv.getUser(options.author);
    let projectUser = userSrv.getUser(user);
    let aChatLine;

    // create chatLine after author und projectUser are loaded
    return Promise.all([getAuthor, projectUser])
        .then(function([author, projectUser]) {

            // todo was passiert wenn kein author?

            // create chatline
            let chatLine = ChatLine.build({
                userId: projectUser.id,
                ProjectId: projectId,
                authorId: author.id,
                type: options.messageType,
                message: options.message
            });

            // set subject (helprequest)
            if(options.helpRequestId && options.helpRequestId > 0) {
                chatLine.setSubject(options.helpRequestId, {save: false});
            }

            // return new chatLine
            return chatLine.save();
        })
        .then(function(chatLine) {

            // reload chatline to get subject
            return getChatLine(chatLine.id).then(function(chatLine) {

                aChatLine = chatLine;

                // When authorId is not equal to userId the we assume that the teacher has sent an answer.
                // In this case we send a mail to the student with the information that a reply has been received
                if(aChatLine.authorId !== aChatLine.userId && chatLine.author.username !== "Roby") {
                    mailSrv.sendTeacherAddedAnswerMail(
                        (chatLine.user.emailPublic) ? chatLine.user.emailPublic : chatLine.user.email,
                        (chatLine.user.name) ? chatLine.user.name : chatLine.user.username,
                        chatLine.project.projectname
                    ).then(function() {
                        return aChatLine;
                    });
                }
                // otherwise we send an email to the student with the information about the new
                // help requests
                else if(aChatLine.authorId === aChatLine.userId) {
                    mailSrv.sendStudentRequestsHelpMail(
                        (chatLine.user.name) ? chatLine.user.name : chatLine.user.username,
                        chatLine.project.projectname,
                        (chatLine.subject.course) ? chatLine.subject.course.coursename : false,
                        JSON.parse(chatLine.message).cardReference
                    ).then(function() {
                        return aChatLine;
                    });
                }

                return aChatLine;
            });
        })
        .catch(function(err) {
            console.log(err);
        });
};


// export the service functions
exports.getChatLine = getChatLine;
exports.getChatLines = getChatLines;
exports.addChatLine = addChatLine;

