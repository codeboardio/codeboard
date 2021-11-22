/**
 * Created by haches on 7/27/14.
 *
 * This service module provides a number of
 * utility functions for user data stored
 * in the database.
 */

'use strict';


let db = require('../models');


/**
 * Returns a promise that resolves to the user
 * with the given username (might be null if no entry of with that username exists).
 * @param username for which username the user should be returned
 * @param attributes the attributes of that user that should be returned
 * @returns {*|Object|Mixed} promise resolving to a user
 */
var getUser = function(username, attributes = ['id', 'username', 'role', 'email']) {

  return db.User.findOne(
    {
      where: {username: username},
      attributes: attributes
    }
  );
};

/**
 * Returns a promise that resolves to the user with the given id.
 * @param userId
 * @param attributes
 * @returns {Promise<Model | null> | Promise<Model>}
 */
let getUserById = function(userId, attributes = ['id', 'username', 'role', 'email']) {
    return db.User.findByPk(userId, {
            attributes: attributes
        }
    );
};

/**
 * Updates the password of a lti user. In contrast to normal users password update does this method not check
 * for current password.
 * Assumes: user
 */
let updateLtiUsers = function(username, new_pw, email) {
    // find and change users password
    return db.User.findOne({ where: {username: username}, attributes: ['id', 'password'] })
        .then(function(usr) {
            if(usr !== null) {
                usr.password = new_pw;
                usr.email = email;
                return usr.save().then(function() {
                    return usr;
                });
            }
            else {
                return null;
            }
        });
};


exports.getUser = getUser;
exports.getUserById = getUserById;
exports.updateLtiUsers = updateLtiUsers;
