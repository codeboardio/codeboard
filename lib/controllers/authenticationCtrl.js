/**
 * Created by haches on 7/10/14.
 *
 * Controller that handles the authentication,
 * in particualr login and logout.
 */

const passport = require('passport');
const logSrv = require('../services/logSrv.js');
const userSrv = require('../services/userSrv.js');
const ltiSrv = require('../services/ltiSrv');



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
    res.status(200).json({username: req.user.username, role: req.user.role});
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


/**
 * This middleware is called when the lti user was found by its 'user_id' but the
 * 'lis_person_sourdid' changed due to moodle changes..
 * Assumes: username exists
 * @param req
 * @param res
 * @param next
 */
let updateLtiUserPassword = function(req, res, next) {
  // get username and new_pw
  const userId = req.body.user_id;
  const lisPersonSourcedid = req.body.lis_person_sourcedid;
  //
  userSrv.updateLtiUsers(userId, ltiSrv.generatePasswordFromLtiData(lisPersonSourcedid), lisPersonSourcedid)
      .then(user => {
        if(user) {
          next();
        } else {
          console.log('Could not change LTI user password. User: ' + userId + ", " + lisPersonSourcedid);
          res.status(401).json({
            message: 'LTI user login not working 1. User: ' + userId + ", " + lisPersonSourcedid,
            authenticated: false
          });
        }
      })
      .catch(err => {
        console.log("Error changing lti password" + err);
        res.status(401).json({
          message: 'LTI user login not working 2. User: ' + userId + ", " + lisPersonSourcedid,
          authenticated: false
        });
      });
};



exports.login = login;
exports.logout = logout;
exports.isAuthenticated = isAuthenticated;
exports.authenticateLtiUserElseNextRoute = authenticateLtiUserElseNextRoute;
exports.updateLtiUserPassword = updateLtiUserPassword;
