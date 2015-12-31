/**
 * Created by hce on 7/11/14.
 *
 * Custom middleware used by the application
 */

var db = require('./models'),
  Promise = require('bluebird'),
  projectSrv = require('./services/projectSrv.js'),
  ltiSrv = require('./services/ltiSrv.js'),
  logSrv = require('./services/logSrv.js');


/**
 * Implementation to check if a user is authenticated.
 */
var isAuthImp = function (req, res, next, onFailUseNextRoute) {
  if (req.isAuthenticated())
    next();
  else {
    if (onFailUseNextRoute)
      next('route');
    else
      res.send(401);
  }
};


/**
 *  Protects routes of the api from unauthenticated access.
 *  Executes next() or a sends a 401.
 */
var isAuth = function (req, res, next) {
  isAuthImp(req, res, next, false);
};


/**
 *  Protects routes of the api from unauthenticated access.
 *  Executes next() or next('route').
 */
var isAuthElseNextRoute = function (req, res, next) {
  isAuthImp(req, res, next, true);
};


/**
 * Route can only be accessed if the projectId in the route is a valid id.
 * Executes next() or sends a 404.
 */
var isValidProjectId = function(req, res, next) {

  var projectId = req.params.projectId;

  projectSrv.isValidProjectId(projectId)
    .then(function(isValid) {
      if(isValid)
        next();
      else {
        logSrv.addPageLog(logSrv.events.openNonExistingProjectEvent(req));
        res.send(404);
      }
    });
};


/**
 * Route can only be access if the :submissionId exists and the :projectId matches the db row of the :submissionId.
 * Executes next() or a sends a 404.
 */
var isValidProjectIdAndSubmissionIdCombo = function(req, res, next) {

  var projectId = req.params.projectId;
  var submissionId = req.params.submissionId;

  db.Submission
    .find({
      where: {id: submissionId}
    })
    .then(function(result) {

      if(result !== null && result.projectId.toString() === projectId) {
        next();
      }
      else {
        res.send(404);
      }

    })
    .catch(function(err) {
      res.send(500, err);
    });
};


/**
 * Route can only be access if the :userprojectId exists and the :projectId matches the db row of the :userprojectId.
 * Executes next() or a sends a 404.
 */
var isValidProjectIdAndUserprojectIdCombo = function(req, res, next) {

  var projectId = req.params.projectId;
  var userprojectId = req.params.userprojectId;

  db.UserProject
    .find({
      where: {id: userprojectId}
    })
    .then(function(result) {

      if(result !== null && result.projectId.toString() === projectId) {
        next();
      }
      else {
        res.send(404);
      }

    })
    .catch(function(err) {
      res.send(500, err);
    });
};

/**
 * Route can only be access if the authenticated user is the user mentioned in the route.
 * Assumes: user is authenticated
 * Executes next() or a sends a 401.
 */
var isSelf = function(req, res, next) {
  if (req.user.username === req.params.username)
    next();
  else
    res.send(401);
};


/**
 * Implementation for the checking if the authenticated user is a owner.
 * Assumes: user is authenticated, :projectid is part of the route
 */
var isOwnerImpl =  function(req, res, next, onFailUseNextRoute) {

  // extract the id from the route
  var projectId = req.params.projectId;
  // the user should be authenticated at this point
  var username = req.user.username;

  projectSrv.isProjectOwner(projectId, username)
    .then(function(isOwner) {

      if(isOwner)
        next();
      else {
        if (onFailUseNextRoute)
          next('route');
        else
          res.send(401);
      }

    })
    .error(function(err) {
      res.send(500);
    });
};


/**
 * Route can only be access if the current user is the owner of the project.
 * If user is not owner, a 401 response is send.
 * Assumes: user is authenticated, :projectid is part of the route
 * Executes next() or a  sends a 401.
 */
var isOwner =  function(req, res, next) {
  isOwnerImpl(req, res, next, false);
};


/**
 * Route can only be access if the current user is the owner of the project.
 * Assumes: user is authenticated, :projectid is part of the route
 * Executes next() or next('route').
 */
var isOwnerElseNextRoute = function(req, res, next) {
  isOwnerImpl(req, res, next, true);
};


/**
 * Implementation to check if a given user is a user of a given project.
 * Assumes: user is authenticated, :projectid is part of the route
 */
var isUserImpl = function(req, res, next, onFailUseNextRoute) {
  // extract the id from the route
  var projectId = req.params.projectId;
  // the user should be authenticated at this point
  var username = req.user.username;

  projectSrv.isProjectUser(projectId, username)
    .then(function(isUser) {

      if(isUser)
        next();
      else {
        if (onFailUseNextRoute)
          next('route');
        else
          res.send(401);
      }

    })
    .error(function(err) {
      res.send(500);
    });
};


/**
 * Route can only be access if the current user is a user of the project.
 * Assumes: user is authenticated, :projectid is part of the route
 * Executes next() or next('route').
 */
var isUserElseNextRoute = function(req, res, next) {
  isUserImpl(req, res, next, true);
};


/**
 * Implementation for the checking if the authenticated user is an owner or a user.
 * Assumes: user is authenticated, :projectid is part of the route
 */
var isOwnerOrUserImpl =  function(req, res, next, onFailUseNextRoute) {

  // extract the id from the route
  var projectId = req.params.projectId;
  // the user should be authenticated at this point
  var username = req.user.username;

  projectSrv.isProjectOwnerOrUser(projectId, username)
    .then(function(isOwnerOrUser) {

      if(isOwnerOrUser)
        next();
      else {
        if (onFailUseNextRoute)
          next('route');
        else
          res.send(401);
      }
    })
    .error(function(err) {
      res.send(500);
    });
};


/**
 * Route can only be access if the current user is owner or user of the project.
 * If user is not owner, a 401 response is send.
 * Assumes: user is authenticated, :projectid is part of the route
 * Executes next() or a  sends a 401.
 */
var isOwnerOrUser =  function(req, res, next) {
  isOwnerOrUserImpl(req, res, next, false);
};


/**
 * Route can only be access if the current user is owner or user of the project.
 * Assumes: user is authenticated, :projectid is part of the route
 * Executes next() or next('route').
 */
var isOwnerOrUserElseNextRoute = function(req, res, next) {
  isOwnerOrUserImpl(req, res, next, true);
};


/**
 * Route can only be accessed if the project is public.
 * If project is not public, a 401 response is send.
 * Assumes: :projectId is part of the route
 */
var isPublicProject = function(req, res, next) {

  // extract the id from the route
  var projectId = req.params.projectId;

  projectSrv.isPublicProject(projectId)
    .then(function(isPublic) {

      if(isPublic)
        next();
      else
        res.send(401);
    })
    .error(function(err) {
      res.send(500);
    });
};


/**
 * Route can only be accessed if the request has LTI information and the project allows for the LTI session.
 * Assumes: the projectId is valid
 * Executes next() if user is authorized via LTI or else next('route').
 */
var isLtiUserElseNextRoute = function(req, res, next) {

  var projectId = req.params.projectId;

  // object where we collect the LTI data that was send as part of the request
  var ltiData = {
    hasLtiData: false
  };

  // we can have either a GET request (for loading a project) or a POST request for compiling, running etc. a project
  // depending on the method of the request we need to check for LTI data differently
  if(req.method === 'GET') {

    // any ltiData would be send as query parameters
    if(req.query.ltiSessionId && req.query.ltiUserId && req.query.ltiNonce) {
      ltiData.hasLtiData = true;
      ltiData.ltiSessionId = req.query.ltiSessionId;
      ltiData.ltiUserId = req.query.ltiUserId;
      ltiData.ltiNonce = req.query.ltiNonce;
    }
  }
  else if(req.method === 'POST' || req.method === 'PUT') {

    // Note: POST is used by when making a submission; PUT is used when an LTI user wants to save her changes

    // any ltiData would be part of the body
    if(req.body.hasLtiData) {
      ltiData.hasLtiData = true;
      ltiData.ltiSessionId = req.body.ltiData.ltiSessionId;
      ltiData.ltiUserId = req.body.ltiData.ltiUserId;
      ltiData.ltiNonce = req.body.ltiData.ltiNonce;
    }
  }


  if(!(ltiData.hasLtiData)) {

    // the request does not contain LTI data, i.e. we don't even need to try to authenticate the user's LTI session
    next('route');
  }
  else {

    // we have LTI data
    // first, however, we need to check if the project has LTI access enabled
    ltiSrv.isLtiAllowedForProject(projectId)
      .then(function(isAllowed) {

        if(isAllowed) {
          // the project allows LTI access
          // now we need to check if the user belongs to a valid LTI session
          return ltiSrv.isValidLtiUserSession(ltiData.ltiSessionId, ltiData.ltiUserId, ltiData.ltiNonce);
        }
        else {
          // the project does not allow LTI access; continue to the next route via rejecting a promise
          return Promise.reject('Access rejected because project ' + projectId + ' does not allow LTI access.');
        }
      })
      .then(function(isValidLtiUserSession) {

        if(isValidLtiUserSession) {
          // the current user request belongs to valid Lti session, thus we grant access to this route
          next();
        }
        else {
          // the current user does not belong to valid Lti session, thus we want to switch to the next route
          return Promise.reject("Access rejected because user's supplied LTI session data is invalid.");
        }
      })
      .catch(function(err) {
        console.log(err);
        next('route');
      });
  }
};


// export the functions
exports.isAuth = isAuth;
exports.isAuthElseNextRoute = isAuthElseNextRoute;
exports.isValidProjectId = isValidProjectId;
exports.isValidProjectIdAndSubmissionIdCombo = isValidProjectIdAndSubmissionIdCombo;
exports.isValidProjectIdAndUserprojectIdCombo = isValidProjectIdAndUserprojectIdCombo;
exports.isSelf = isSelf;
exports.isOwner = isOwner;
exports.isOwnerElseNextRoute = isOwnerElseNextRoute;
exports.isUserElseNextRoute = isUserElseNextRoute;
exports.isOwnerOrUserElseNextRoute = isOwnerOrUserElseNextRoute;
exports.isPublicProject = isPublicProject;
exports.isLtiUserElseNextRoute = isLtiUserElseNextRoute;
