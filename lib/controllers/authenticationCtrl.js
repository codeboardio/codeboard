/**
 * Created by haches on 7/10/14.
 *
 * Controller that handles the authentication,
 * in particualr login and logout.
 *
 */

var passport = require('passport'),
  db = require('../models'),
  logSrv = require('../services/logSrv.js'),
  mailSrv = require('../services/mailSrv.js'),
  coboUtil = require('../util.js');



var login = function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {

    if (err) {
      return next(err);
    }

    if (!user) {
      logSrv.addPageLog(logSrv.events.failedSigninEvent(req));
      return res.json(401, {message: 'Wrong username or password.', authenticated: false});
    }

    req.logIn(user, function(err) {
      if (err) {
        return next(err);
      }
      logSrv.addPageLog(logSrv.events.signinEvent(req, user.username));

      return res.json(200, {username: user.username, authenticated: true});
    });
  })(req, res, next);
};


var logout = function(req, res) {
  logSrv.addPageLog(logSrv.events.signoutEvent(req));
  req.logout();
  res.send(200);
};


var isAuthenticated = function(req, res) {
  if(req.isAuthenticated())
    res.json(200, {username: req.user.username});
  else
    res.json(401, {message: 'The user is not authenticated.'});
};


var resetPassword = function (req, res) {

  // first we validate the request
  req.checkBody('email', 'Email may not be empty.').notEmpty();
  req.checkBody('email', 'Invalid email. Provide a valid email address.').isEmail();

  var valErrors = req.validationErrors();
  if(valErrors) {
    res.json(400, {msg: 'There have been validation errors. '});
  }
  else {
    // no validation errors, so we'll try to update the user password
    var _email = req.body.email;

    db.User
      .find({
        where: {email: _email},
        attributes: ['id', 'username', 'email']
      })
      .then(function(usr) {

        if(usr != null) {
          // get a random password
          var _newPassword = coboUtil.getRandomPassword();

          // password was correct, thus set the new password
          usr.password = _newPassword;
          usr.save()
            .then(function () {
              return mailSrv.sendResetPasswordMail(usr.email, _newPassword);
            })
            .then(function (successValues) {
              // successValues is a complex object with data about the the email send
              // at the moment we don't do anything with it

              res.json(200, {msg: 'Password has been changed.'});
            })
            .catch(function(err) {
              console.log("Server.AuthCtrl - Error sending email to reset password: " + JSON.stringify(err));
              res.json(500, {msg: 'Error sending email to reset password'});
            });
        }
        else {
          // no user with the given email found
          res.json(403, {msg: 'The provided email is not registered.'});
        }
      });
  }


};

exports.login = login;
exports.logout = logout;
exports.isAuthenticated = isAuthenticated;
exports.resetPassword = resetPassword;
