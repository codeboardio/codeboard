/**
 * Created by haches on 7/8/14.
 *
 * Defines the strategy of passport.js
 *
 * Provides serialization & de-serialization functions for sessions.
 */


'use strict';

var db = require('../models'),
  Sequelize = require('sequelize'),
  passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  util = require('../util.js');

/**
 * Passport configuration
 */
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

// add other strategies for more authentication flexibility
passport.use(new LocalStrategy({
    usernameField: 'username', // these are optional & only need be used in case 'username' and 'password' are names used in the request
    passwordField: 'password' // this is the virtual field on the model
  },
  function(username, password, done) {

    db.User.findOne({attributes: ['id', 'username', 'email', 'password', 'salt'], where: Sequelize.or({username: username}, {email: username})})
      .then(function(user) {
          console.log(user);

        if(user === null)
          return done(null, false, {message: 'User is not registered.'});

        console.log(util.getEncryptedPassword(password));
        console.log(user.password);
        console.log(user.salt);

        if(!util.verifyPassword(password, user.password, user.salt)) {
            console.log("PW falsch");
            return done(null, false, {message: 'Incorrect password'});
        }


        console.log("Passiert hier noch was?");
        return done(null, {id: user.id, username: user.username, email: user.email}); // we serialize the username, id and email
      })
      .error(function(err) {
          console.log(err);

        return done(err);
      });
  }
));

module.exports = passport;