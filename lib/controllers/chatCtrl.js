/**
 * Todo: ChatLine Service verwenden anstatt alles direkt hier zu definieren..
 *
 *
 * @author Janick Michot
 * @date 27.12.2019
 */

'use strict';

const config = require('../config/config');
const chatSrv = require('../services/chatSrv.js');
const compilationSrv = require('../services/compilationSrv.js');

/**
 * Function to add a single chat line. A chat line refers to one project and one user
 * @param req
 * @param res
 */
let addChatLine = function(req, res) {

    // if author avatar, change author name to the name specified in the configuration
    if(req.body.author === "avatar") {
        req.body.author = config.avatarSettings.name;
    }

    // prepare chat line values
    let chatLineOptions = {
        author: req.body.author,
        message: req.body.aMessage || '',
        messageType: req.body.type || 'text',
        helpRequestId: req.body.helpRequestId || -1
    };

    // create chat line via chatSrv
    chatSrv.addChatLine(req.params.username, req.params.projectId, chatLineOptions)
        .then(function(chatLine) {

            // load new chat line with all dependencies
            chatSrv.getChatLine(chatLine.id)
                .then(function(chatLine) {
                    res.status(200).json(chatLine);
                });
        })
        .catch( function(error) {
            res.status(500).json(error);
        });
};

/**
 * Function to retrieve all chat messages for a certain user and project
 * @param req
 * @param res
 */
let getChatHistory = function(req, res) {

    chatSrv.getChatLines(req.params.username, req.params.projectId)
        .then(function(chatLines) {
            res.status(200).json({data: chatLines});
        })
        .catch(function(error) {
            console.log(error);
            res.status(500).json(error);
        });
};

/**
 * This methods is only used as long as we dont have a general chatLine rating system.
 * todo replace by a general chatLine rating system
 * @param req.params.chatLineId   ACHTUNG: enspricht im Moment nicht einer ChatLineId, sondern CompilationErrorId
 * @param req.body.rating
 * @param res
 */
let rateErrorCompilationMessage = function(req, res) {

    compilationSrv.rateCompilationErrorMessage(req.params.chatLineId, req.body.rating)
        .then(function(updated) {
            if(updated) {
                res.sendStatus(200);
            } else {
                res.sendStatus(404);
            }
        })
        .catch(function(error) {
            res.status(500).json(error);
        });
};



// export the service functions
exports.addChatLine = addChatLine;
exports.getChatHistory = getChatHistory;
exports.rateErrorCompilationMessage = rateErrorCompilationMessage;
