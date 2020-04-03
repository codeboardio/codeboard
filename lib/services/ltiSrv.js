/**
 * Created by hce on 9/18/14.
 *
 * This service provides functionality that's
 * need to enable LTI support.
 *
 */

var db = require('../models'),
  crypto = require('crypto'),
  Promise = require('bluebird'),
  request = Promise.promisifyAll(require('request')), // use bluebird promises for requests
  oauthSignature = require('oauth-signature'),
  config = require('../config/config');

/**
 * Function to check if a request from an LTI request for a project is authorized.
 * @param req the request that was send by the LTI tool consumer (e.g. edX or Moodle)
 * @return {Promise<T>} returns true it the oauth_signature matches with the LTI settings
 */
var isRequestAuthorized = function (req) {

    // the id of project
    let _projectId = req.params.projectId;

    // start by looking up the project details, especially regarding the lti settings
    return db.Project.findByPk(_projectId)
        .then(function (prj) {

            // project doesnt allow lti
            if(!prj.isLtiAllowed) return false;

            // get all the properties of the body, except for the one that's 'oauth_signature'
            var _parameters = {};

            for (var property in req.body) {
                if (property !== 'oauth_signature') {
                    _parameters[property] = req.body[property];
                }
            }

            // for oauth we need the method that was used for this request
            var _httpMethod = req.method;

            // for oauth we need the full url that was used for this request
            // Note: because we're behind a load balancer in production we use a config entry instead of req.get('host')
            var _url = config.host + req.originalUrl;

            // for oauth we need the secret from the database (the lti key is part of the request already)
            var _consumerSecret = prj.ltiSecret;
            // for oauth we need to put the tokenSecret property, even if we don't use it
            var _tokenSecret = '';

            // generate the signature for the request
            var _encodedSignature = oauthSignature.generate(_httpMethod, _url, _parameters, _consumerSecret, _tokenSecret);

            // check if the signature of the request matches the signature we calculated
            // Note: we decode the percentage encoding of the the calculated signature
            return (req.body.oauth_signature === oauthSignature.Rfc3986.prototype.decode(_encodedSignature));
        });
};

/**
 * Generates a reusable password from the LTI data
 * @author Janick Michot
 * @param password
 */
var generatePasswordFromLtiData = function(password) {
    password = password.replace(/[&\/\\#,+()$@\-~%.'":*?<>{}]/g,'');
    return password.substring(5, 15);
};

/**
 * Returns a lti user by username
 * @param username
 */
var getLtiUser = function(username) {
    return db.User.scope('ltiUser').findOne({
        where: {username: username}
    });
};

/**
 * Tries to create an user with the lti data
 * @author Janick Michot
 * @param req
 * @returns {userData}
 */
var createLtiUser = function(req) {

    // translate lti user data into our db schema
    let userData = {
        username: req.body.user_id,
        email: req.body.lis_person_sourcedid || '',
        name: req.body.lis_person_name_given || '',
        emailPublic: req.body.lis_person_contact_email_primary || '',
        password: generatePasswordFromLtiData(req.body.lis_person_sourcedid),
        role: 'ltiUser'
    };

    // create new lti user
    return db.User.create(userData);
};


/**
 * Prepares the payload for submitting a grade and sends the request to submit a grade.
 * @param grade the grade to submit
 * @param sourcedId the LTI sourcedId that identifies the student and the exercises
 * @param url the url to where the grade should be send
 * @param key the LTI key
 * @param secret the LTI secret
 * @return {*} a promise that resolves into the response from the LTI Consumer (e.g. edX platform)
 */
var sendGrade = function(grade, sourcedId, url, key, secret) {

  // the main payload in XML format
  var payload =
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<imsx_POXEnvelopeRequest xmlns = "http://www.imsglobal.org/services/ltiv1p1/xsd/imsoms_v1p0">' +
      '<imsx_POXHeader>'+
      '<imsx_POXRequestHeaderInfo>'+
      '<imsx_version>V1.0</imsx_version>'+
      '<imsx_messageIdentifier>'+ Math.floor(Math.random()*1000000) +'</imsx_messageIdentifier>'+
      '</imsx_POXRequestHeaderInfo>'+
      '</imsx_POXHeader>'+
      '<imsx_POXBody>'+
      '<replaceResultRequest>'+
      '<resultRecord>'+
      '<sourcedGUID>'+
      '<sourcedId>' + sourcedId + '</sourcedId>'+
      '</sourcedGUID>'+
      '<result>'+
      '<resultScore>'+
      '<language>en</language>'+
      '<textString>' + grade + '</textString>'+
      '</resultScore>'+
      '</result>'+
      '</resultRecord>'+
      '</replaceResultRequest>'+
      '</imsx_POXBody>'+
      '</imsx_POXEnvelopeRequest>';

  // Note: as per LTI 1.1.1 spec, we need to have an 'oauth_body_hash' (see section 4.3).
  // As request does not put it automatically, we calculate it manually and put it as an oAuth property.
  var sha1 = crypto.createHash('sha1');
  sha1.update(payload);
  var body_hash = sha1.digest('base64');
  var oAuth = {
    consumer_key: key,
    consumer_secret: secret,
    body_hash : body_hash
  };

  // the options for the request
  var options  = {
    url: url,
    body: payload,
    oauth: oAuth,
    followAllRedirects:"true",
    headers: {
      'Content-Type': 'application/xml',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  // send the request and return the promise
  return request.postAsync(options);
};


/**
 * Submits a grade to an LTI Tool Consumer (e.g. the edX platform).
 *
 * @param projectId the id of the project
 * @param ltiSessionId the (database) id of the ltiSession that the should be used to send back the grade
 * @param ltiUser the userId that belongs to the ltiSession; if the userId doesn't match the ltiSessionId no request will be send
 * @param ltiNonce the ltiNonce that belongs to the ltiSession; if the userId doesn't match the ltiSessionId no request will be send
 * @param grade the grade to be send
 * @return {Promise|*} promise resolves to an object {success: boolean, msg: String} which has 'success==true' if the grade was submitted successfully, otherwise there's an error message in 'msg'
 */
var submitGradeToLtiToolConsumer = function(projectId, ltiSessionId, ltiUser, ltiNonce, grade) {

  // local variables to store the key and secret for the LTI oauth
  var _ltiKey, _ltiSecret;

  // the object we return; will be modified if something goes wrong
  var result = {success: true, msg: 'Your solution was successfully submitted.'};

  // first we try to get the project from the database to check its LTI settings
  return db.Project
    .findByPk(projectId)
    .then(function(prj) {

      // we have the project and verify that LTI submissions is acutally enabled
      if(prj !== null && !prj.isLtiAllowed) {
        return Promise.reject('Invalid project or project has no LTI support enabled.');
      }

      // store the key and secret for later use
      _ltiKey = prj.ltiKey;
      _ltiSecret = prj.ltiSecret;

      // now try to find an LtiSession that satisfies the three lti properties submitted by the user
      return db.LtiSession
         .findOne({
            where: {id: ltiSessionId, oauthNonce: ltiNonce},
            include: { model: db.User, where: {username: ltiUser}}
         });
    })
    .then(function(ltiSession) {

      // if we can't find an LtiSession with the given parameters, throw an error
      if(ltiSession === null) {
        return Promise.reject('No valid LTI session for {ltiSession: ' + ltiSessionId +', ltiUser: ' + ltiUser + ', ltiNonce: ' + ltiNonce + '}.\n' +
          'Try the following options:' +
          '\n1) Submit your solution again.' +
          '\n2) If resubmitting does not help, reload the page and try again (make sure to save your changes before reloading).' +
          '\n3) If the problem remains, please contact the course admin and send this message');
      }
      else {
        // make the request that sends the grade
        return sendGrade(grade, ltiSession.lisResultSourcedid, ltiSession.lisOutcomeServiceUrl, _ltiKey, _ltiSecret);
      }

    })
    .then(function (res) {

      // if we got some error from the TC, report it.
      if(res.statusCode !== 200) {
       return Promise.reject('Error while submitting grade to LTI TC platform. Try to submit again or report the problem to the course admin');
      }

      return result;

    })
    .catch(function(err) {
      result.success = false;
      result.msg = err;
      return result;
    });
};


/**
 * Checks if a project is allowing access via LTI.
 * @param projectId the id of the project
 * @return {*} a promise that resolves to 'true' if LTI access is allowed, otherwise false
 */
var isLtiAllowedForProject = function(projectId) {

  return db.Project
    .findByPk(projectId)
    .then(function(prj) {
      // let's check that we acutally got a project form the db
      if(prj !== null) {
        return prj.isLtiAllowed;
      }
      else {
        return false;
      }
    })
    .catch(function(err){
      console.error('DB error: checking LTIAllowed for project:' + projectId + '; Error msg: ' + err);

      return false;
    });
};


/**
 * Checks if the database has an LitSession with the parameters given in the arguments
 * @param ltiSessionId the id of the LtiSession
 * @param ltiUserId the userId of the LtiSession
 * @param ltiNonce the ltiNonce of the LtiSession
 * @return {*} a promise that resolves to true if a session with the given parameters exists, otherwise false
 */
var isValidLtiUserSession = function(ltiSessionId, ltiUserId, ltiNonce) {

  return db.LtiSession
    .findOne({
        where: {id: ltiSessionId, oauthNonce: ltiNonce},
        include: { model: db.User, where: {username: ltiUserId}}
    })
    .then(function(session) {

      if(session !== null) {
        // we got a session-object that matched the the inputs; thus, it's a valid lti session
        return true;
      }
      else {
        // no matching session-object in the db
        return false;
      }

    })
    .catch(function(err) {
      console.error('DB error: checking valid LtiSession for {ltiSessionId: ' + ltiSessionId + ', litUserId: ' + ltiUserId + ', ltiNonce: ' + ltiNonce + '; Error msg: ' + err);

      return false;
    });
};

/**
 * Checks if the database has an LitSession with the parameters given in the arguments
 * @param projectId the id of the project
 * @param ltiSessionId the id of the LtiSession
 * @param ltiUserId the userId of the LtiSession
 * @param ltiNonce the ltiNonce of the LtiSession
 * @return {*} a promise that resolves to true if a session with the given parameters exists, otherwise false
 */
var isValidLtiUserProjectSession = function(projectId, ltiSessionId, ltiUserId, ltiNonce) {

    return db.LtiSession
        .findOne({
            where: {id: ltiSessionId, oauthNonce: ltiNonce, projectId: projectId},
            include: { model: db.User, where: {username: ltiUserId}}
        })
        .then(function(session) {

            if(session !== null) {
                // we got a session-object that matched the the inputs; thus, it's a valid lti session
                return true;
            }
            else {
                // no matching session-object in the db
                return false;
            }

        })
        .catch(function(err) {
            console.error('DB error: checking valid LtiSession for {ltiSessionId: ' + ltiSessionId + ', litUserId: ' + ltiUserId + ', ltiNonce: ' + ltiNonce + '; Error msg: ' + err);

            return false;
        });
};


/**
 * Checks if the database has an LitSession with the parameters given in the arguments
 * @param projectId the id of the project
 * @param ltiSessionId the id of the LtiSession
 * @param ltiUserId the userId of the LtiSession
 * @param ltiNonce the ltiNonce of the LtiSession
 * @param courseId the courseId of the current LtiSession
 * @return {*} a promise that resolves to true if a session with the given parameters exists, otherwise false
 */
var isValidLtiUserProjectSession = function(projectId, ltiSessionId, ltiUserId, ltiNonce, courseId) {

    return db.LtiSession
        .findOne({
            where: {id: ltiSessionId, oauthNonce: ltiNonce, projectId: projectId},
            include: { model: db.User, where: {username: ltiUserId}}
        })
        .then(function(session) {

            if(session !== null) {

                if(session.CourseId !== parseInt(courseId)) {
                    // no matching courseId
                    return false;
                }

                // we got a session-object that matched the the inputs; thus, it's a valid lti session
                return session;
            }
            else {
                // no matching session-object in the db
                return false;
            }

        })
        .catch(function(err) {
            console.error('DB error: checking valid LtiSession for {ltiSessionId: ' + ltiSessionId + ', litUserId: ' + ltiUserId + ', ltiNonce: ' + ltiNonce + '; Error msg: ' + err);

            return false;
        });
};



// export the service functions
exports.submitGradeToLtiToolConsumer = submitGradeToLtiToolConsumer;
exports.isLtiAllowedForProject = isLtiAllowedForProject;
exports.isValidLtiUserSession = isValidLtiUserSession;
exports.isValidLtiUserProjectSession = isValidLtiUserProjectSession;
exports.sendGrade = sendGrade;
exports.isRequestAuthorized = isRequestAuthorized;
exports.createLtiUser = createLtiUser;
exports.getLtiUser = getLtiUser;
exports.generatePasswordFromLtiData = generatePasswordFromLtiData;
