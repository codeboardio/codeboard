/**
 * Created by haches on 7/7/14.
 *
 * The controler that holds all the logic
 * related to users.
 *
 */

var db = require('../models'),
  userSrv = require('../services/userSrv.js'),
  coboUtil = require('../util.js'),
  util = require('util'),
  path = require('path'),
  config = require('../config/config.js'),
  Promise = require('bluebird'),
  logSrv = require('../services/logSrv.js'),
  mailSrv = require('../services/mailSrv.js');


/**
 * Creates a new user in the DB, sends a wecome email, and returns the user object.
 * @param req
 * @param res
 */
var createUser = function(req, res) {

  // Note: because Sequelize DB-Model validation would not work for the "password" because it uses a custom "setter" function in the Model,
  // we've decided to manually validate the payload of the request.
  // See also:  https://github.com/sequelize/sequelize/issues/2367

  // Validate the password that's part of the req
  req.checkBody('username', 'Invalid username. A username must have between 2 and 30 characters.').isLength(2, 30);
  req.checkBody('username', 'Invalid username. A username must be alphanumeric.').isAlphanumeric();
  req.checkBody('password', 'Invalid password. A password must be at least 4 characters long.').isLength(4);
  req.checkBody('email', 'Invalid email. Please provide a valid email address.').isEmail();

  // if have any validation errors, we return an error response with an appropriate message
  var validationErrors = req.validationErrors();
  if (validationErrors && validationErrors.length > 0) {

    // we have 1 or more validation errors in an array; we turn the array messages into a single message
    var validationErrorMsg = validationErrors[0].msg;
    for (var i = 1; i < validationErrors.length; i++) {
      validationErrorMsg += ' ' + validationErrors[i].msg;
    }

    res.status(422).json({msg: validationErrorMsg});
    return;
  }

  // we keep track when we send the response so we don't try to send multiple responses if something goes wrong further down in the promise chain
  var responseAlreadySend = false;

  db.User.create(
    {
      username: req.body.username,
      password: req.body.password,
      email: req.body.email,
      imageUrl: path.join(config.userProfileDefaultImagePath, ('smile' + Math.floor((Math.random() * 5) + 1) + '.png'))
    })
    .then(function(user) {

      logSrv.addPageLog(logSrv.events.createUserEvent(req));

      // send the response with the created user data
      res.status(200).json(user);
      responseAlreadySend = true;

      return user;
    })
    .then(function(user) {

      // send the welcome email
      // if the given email address is not valid, the catch below will print a log of that
      return mailSrv.sendWelcomeMail(req.body.username, req.body.email);
    })
    .catch(function(err) {

      // we might get an error from the database if a Username or Email already exists in the DB
      if (err && err.name && err.name === 'SequelizeUniqueConstraintError') {

        if (err.errors && err.errors.length > 0) {

          // the path property of an error tells us on with DB column the error occurred
          if (err.errors[0].path === 'username') {

            // we use 'UserExists' and 'EmailExists' properties to tell the client which type of error the DB reported
            res.status(409).json({error: 'UserExists', msg: 'User ' + req.body.username + ' already exists.'});
          }
          else if (err.errors[0].path === 'email') {
            res.status(409).json({error: 'EmailExists', msg: 'Email ' + req.body.email + ' is already in use.'});
          }
          else {
            res.status(500).json({error: 'UnknownValidationError', msg: 'An unknown validation error occurred. Please try again.'});
          }
        }
      }
      else if (!responseAlreadySend) {
        console.log('controllers/usersjs.createUser: Error while signing up a new user.' +
          '\nCause of error unclear and we have not send a response yet. So will send 500 response.\nError message: ' + JSON.stringify(err));

        res.status(500).json({error: 'UnknownError', msg: 'An unknown error occurred. Please try again.'});
      }
      else {
        // we've send some response but we still want to log the error
        console.log('controllers/usersjs.createUser: Error while signing up a new user.' +
          '\nSuccessfully send a http-response to the user but then got an error.\nError message: ' + JSON.stringify(err));
      }
    });
};


var getUsers = function(req, res) {
  db.User
    .findAll(
      {
        attributes: ['username', 'emailPublic', 'location', 'imageUrl', 'createdAt'],
        order: 'username'
      }
    )
    .then(function(users) {
      res.send(200, users);
  });
};


var getUser = function(req, res) {

  var userName = req.params.username;

  db.User
    .find(
      {
        where: {username: userName},
        attributes: ['username', 'emailPublic', 'name', 'url', 'location', 'institution', 'imageUrl']
      }
    )
    .then(function(user) {
    if(user === null) {
      res.json(404, {message: 'User ' + userName + ' does not exist.'});
    } else {
      res.json(200, user);
    }
  });
};


var getUserSettings = function(req, res) {

  userSrv.getUser
    (
      req.user.username,
      ['id', 'username', 'email', 'emailPublic', 'name', 'url', 'location', 'institution', 'imageUrl']
    )
    .then(function(usr) {
      if(usr === null) {
        // this shouldn't happen because the user authenticated but we have it in place anyway
        res.json(404, {message: 'User does not exist.'});
      }
      else {
        logSrv.addPageLog(logSrv.events.accessUserProfileEvent(req));
        res.json(200, usr);
      }
    })
    .error(function(err) {
      res.json(500, {message: 'Error occured retriving the user data.'});
    });
};


var putUserSettings = function(req, res) {

  var userName = req.params.username;

  db.User.find({where: {username: userName}}).then(function(user) {
    if(user === null) {
      res.json(404, {message: 'User ' + userName + ' does not exist'});
    }
    else {
      for(var property in req.body) {
        //TODO: we need to check if we only have the properties we're interested in.
        user[property] = req.body[property];
      }

      user.save()
       .then(function(aUser) {
          logSrv.addPageLog(logSrv.events.updateUserProfileEvent(req));
          res.send(aUser);
        })
        .catch(function(err) {
          res.json(500, {msg: 'Error updating the user settings.'});
        });
    }
  });
};


/**
 * Updates the password of a user.
 * Assumes: user is authenticated and thus username available in req.user.username
 * Assumes: user
 */
var putPassword = function(req, res) {

  var _username = req.user.username;

  // first we validate the request
  req.checkBody('currentPassword', 'Current password may not be empty.').notEmpty();
  req.checkBody('newPassword', 'New password must have at least 4 characters.').notEmpty().isLength(4);

  var valErrors = req.validationErrors();
  if(valErrors) {
    res.json(400, {msg: 'There have been validation errors: ' + util.inspect(valErrors)});
  }
  else {
    // no validation errors, so we'll try to update the user password
    var _currentPassword = req.body.currentPassword;
    var _newPassword = req.body.newPassword;

    db.User
      .find({
        where: {username: _username},
        attributes: ['id', 'password', 'salt']
      })
      .then(function(usr) {

        if(usr != null) {

          // check that the current password is correct
          if (coboUtil.verifyPassword(_currentPassword, usr.password, usr.salt)) {

            // password was correct, thus set the new password
            usr.password = _newPassword;
            usr.save().then(function() {
              res.json(200, {msg: 'Password has been changed.'});
            });
          }
          else {
            // the current password was not correct
            res.json(403, {msg: 'Incorrect current password.'});
          }
        }
        else {
          // something else went wrong
          res.json(500, {msg: 'Invalid request. Check username (' + _username + ') and server status.'});
        }
      });
  }
};


exports.createUser = createUser;
exports.getUsers = getUsers;
exports.getUser = getUser;
exports.getUserSettings = getUserSettings;
exports.putUserSettings = putUserSettings;
exports.putPassword = putPassword;
