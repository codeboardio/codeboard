/**
 *
 * @author Janick Michot
 * @date 27.12.2019
 */

let db = require('../models'),
    userSrv = require('../services/userSrv.js');


/**
 * Creates a new chatline
 *
 * @param author
 * @param user
 * @param projectId
 * @param message
 * @param type (text, tip, help, html)
 * @param helpRequestId
 * @returns {*}
 */
// let addChatLine = function(author, user, projectId, message = "", type = 'text', helpRequestId = -1) {

/**
 *
 * @param user
 * @param projectId
 * @param options obj{author, message, messageType, helpRequestId}
 * @returns {*}
 */
let addChatLine = function(user, projectId, options = {}) {

    console.log(options);

    // create promises
    let getAuthor = userSrv.getUser(options.author);
    let projectUser = userSrv.getUser(user);

    // create chatLine after author und projectUser are loaded
    return Promise.all([getAuthor, projectUser])
        .then(function([author, projectUser]) {

            // todo was passiert wenn kein author?

            // create chatline
            return db.ChatLine.create({
                userId: projectUser.id,
                projectId: projectId,
                authorId: author.id,
                type: options.messageType,
                message: options.message,
                helprequestId: options.helpRequestId
            });

        }).catch(function(err) {
            console.log(err);
        });
};

/**
 * Return chatline with user and author included
 *
 * @param chatLineId
 * @returns {void|Query|Promise<Model | null>|Promise<Model>}
 */
let getChatLine = function(chatLineId) {

    return db.ChatLine.findOne({
        where: { id: chatLineId },
        include: [
            {
                model: db.User,
                as: 'user',
                attributes: ['username']
            },
            {
                model: db.User,
                as: 'author',
                attributes: ['username']
            },
            {
                model: db.HelpRequest,
                as: 'helprequest',
                attributes: ['status']
            }
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
            return db.ChatLine.findAll({
                where: {
                    userId: projectUser.id,
                    projectId: projectId
                },
                include: [
                    {
                        model: db.User, as: 'user',
                        attributes: ['username']
                    },
                    {
                        model: db.User, as: 'author',
                        attributes: ['username']
                    },
                    {
                        model: db.HelpRequest,
                        as: 'helprequest',
                        attributes: ['status']
                    }
                ]
            });
        });
};



// export the service functions
exports.getChatLine = getChatLine;
exports.getChatLines = getChatLines;
exports.addChatLine = addChatLine;

