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
var getUser = function(username, attributes) {

  return db.User.find(
    {
      where: {username: username},
      attributes: attributes
    }
  );
};


exports.getUser = getUser;