/**
 *
 * @author Janick Michot
 * @date 27.12.2019
 */


'use strict';


let db = require('../models'),
    userSrv = require('../services/userSrv.js');

/**
 * Function to add a single chat line. A chat line refers to one project and one user
 * @param req
 * @param res
 */
let addChatLine = function(req, res) {
    // create promises
    let getAuthor = userSrv.getUser(req.body.author);
    let projectuser = userSrv.getUser(req.params.username);

    // make calls
    Promise.all([getAuthor, projectuser])
        .then(function([author, projectuser]) {
            db.ChatLine.create({
                userId: projectuser.id,
                projectId: req.params.projectId,
                authorId: author.id,
                type: 'submission', // 'help', 'question', 'answer'
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
    db.ChatLine.findAll({
        where: {
            userId: req.user.id,
            projectId: req.params.projectId
        },
        include: [
            {
                model: db.User, as: 'user',
                attributes: ['username']
            }
        ]
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