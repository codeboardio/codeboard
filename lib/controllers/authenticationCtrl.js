/**
 * Created by haches on 7/10/14.
 *
 * Controller that handles the authentication,
 * in particualr login and logout.
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
      return res.status(401).json({message: 'Wrong username or password.', authenticated: false});
    }

    req.logIn(user, function(err) {
      if (err) {
        return next(err);
      }
      logSrv.addPageLog(logSrv.events.signinEvent(req, user.username));

      return res.status(200).json({username: user.username, authenticated: true});
    });
  })(req, res, next);
};


var logout = function(req, res) {
  logSrv.addPageLog(logSrv.events.signoutEvent(req));
  req.logout();
  res.sendStatus(200);
};


var isAuthenticated = function(req, res) {
  if(req.isAuthenticated()) {
    res.status(200).json({username: req.user.username});
  } else {
    res.status(401).json({'message': 'The user is not authenticated.'});
  }
};


/**
 * Tries to authenticate an lti user.
 * If authentication fails, call up the next route
 *
 * @author Janick Michot
 * @param req
 * @param res
 * @param next
 */
var authenticateLtiUserElseNextRoute = function(req, res, next) {
  passport.authenticate('lti-strategy', {}, function(err, user, info) {

    if (err) {
      return next('route');
    }

    if (!user) {
      logSrv.addPageLog(logSrv.events.failedLtiSigninEvent(req));
      return next('route');
    }

    req.logIn(user, {}, function(err) {
      if (err) {
        return next('route');
      }
      logSrv.addPageLog(logSrv.events.LtiSigninEvent(req, user.username));

      next();
    });
  })(req, res, next);
};

exports.login = login;
exports.logout = logout;
exports.isAuthenticated = isAuthenticated;
exports.resetPassword = resetPassword;
exports.authenticateLtiUserElseNextRoute = authenticateLtiUserElseNextRoute;
