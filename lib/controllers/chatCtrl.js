/**
 * Todo: ChatLine Service verwenden anstatt alles direkt hier zu definieren..
 *
 *
 * @author Janick Michot
 * @date 27.12.2019
 */

'use strict';

let db = require('../models'),
    config = require('../config/config'),
    userSrv = require('../services/userSrv.js'),
    chatSrv = require('../services/chatSrv.js');

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


// export the service functions
exports.addChatLine = addChatLine;
exports.getChatHistory = getChatHistory;