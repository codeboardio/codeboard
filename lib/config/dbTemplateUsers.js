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
 * todo brauchen wir einen Admin?
 *  wenn ja, müsste dieser spezielel Berechtigungen haben
 */
let addUserAdmin = function() {
    // silence is gold
};


/**
 * Calls all
 */
let addAllUsers = function() {
    return addUserRoby()
        // .then(function() {
        //     return addUserAdmin();
        // })
        .catch(function(err) {
            console.log("Fehler beim Erstellen der Standardbenutzer");
        });
};


module.exports = {
    addAllUsers: addAllUsers
};

