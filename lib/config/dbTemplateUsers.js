/**
 * Created by Janick Michot on 14/01/20.
 *
 * Adds defaults users (admin / roby) to the database if not already exists
 *
 */

let db = require('../models'),
    Promise = require('bluebird'),
    config = require('./config');


/**
 * Checks if user `avatar` exists and if not it will be created.
 * @returns {Promise}
 */
let addUserRoby = function() {
    return new Promise( function(resolve, reject) {
        db.User.findOne( {
            where: { username: "roby" }
        })
        .then(function(user) {
            if(user === null) {
                db.User.create({
                    username: config.avatarSettings.name,
                    email: config.avatarSettings.email,
                    role: "bot"
                })
                .then( function(user) {
                    resolve();
                });
            }
        });
    });
};

/**
 * Create default admin user
 */
let addUserAdmin = function() {
    return new Promise( function(resolve, reject) {
        db.User.findOne( {
            where: { username: "admin" }
        })
            .then(function(user) {
                if(user === null) {
                    db.User.create({
                        username: "admin",
                        email: "mict@zhaw.ch",
                        role: "admin",
                        password: "kCiqTwE4O19o"
                    })
                        .then( function(user) {
                            resolve();
                        });
                }
            });
    });
};


/**
 * Calls all
 */
let addAllUsers = function() {
    return addUserRoby()
        .then(function() {
             return addUserAdmin();
         })
        .catch(function(err) {
            console.log("Fehler beim Erstellen der Standardbenutzer");
        });
};


module.exports = {
    addAllUsers: addAllUsers
};

