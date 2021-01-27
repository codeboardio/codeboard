/**
 * Created by haches on 7/27/14.
 *
 * This service module provides a number of
 * utility functions for user data stored
 * in the database.
 */

'use strict';


var db = require('../models');


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


exports.getUser = getUser;
exports.getUserById = getUserById;
