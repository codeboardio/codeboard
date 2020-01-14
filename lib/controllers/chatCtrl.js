/**
 *
 * @author Janick Michot
 * @date 27.12.2019
 */


'use strict';


let db = require('../models'),
    config = require('../config/config'),
    userSrv = require('../services/userSrv.js');

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

    // create promises
    let getAuthor = userSrv.getUser(req.body.author);
    let projectUser = userSrv.getUser(req.params.username);

    // create chatLine after author und projectUser are loaded
    Promise.all([getAuthor, projectUser])
        .then(function([author, projectUser]) {
            db.ChatLine.create({
                userId: projectUser.id,
                projectId: req.params.projectId,
                authorId: author.id,
                type: req.body.type || 'text', // 'text', 'card' or 'html'
                message: req.body.aMessage
            })
                .then(function(chatLine) {
                    res.status(200).json(chatLine);
                })
                .catch(function(error) {
                    res.status(500).json(error);
                });
        }).catch(function(err) {
           console.log(err);
        });
};

/**
 * Function to retreive all chat messages for a certain user and project
 * @param req
 * @param res
 */
let getChatHistory = function(req, res) {

    userSrv.getUser(req.params.username)
        .then( function(projectUser) {
            return db.ChatLine.findAll({
                where: {
                    userId: projectUser.id,
                    projectId: req.params.projectId
                },
                include: [
                    {
                        model: db.User, as: 'user',
                        attributes: ['username']
                    },
                    {
                        model: db.User, as: 'author',
                        attributes: ['username']
                    }
                ]
            });
        })
        .then(function(result) {
            res.status(200).json({data: result});
        })
        .catch(function(error) {
            res.status(500).json(error);
        });


};


// export the service functions
exports.addChatLine = addChatLine;
exports.getChatHistory = getChatHistory;