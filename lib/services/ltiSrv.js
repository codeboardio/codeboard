/**
 * Created by hce on 9/18/14.
 *
 * This service provides functionality that's
 * need to enable LTI support.
 *
 */

var db = require('../models'),
  crypto = require('crypto'),
  request = require('request'),
  Promise = require('bluebird'),
  request = Promise.promisifyAll(require('request')); // use bluebird promises for requests


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
    .find(projectId)
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
        .find(
          {where: {id: ltiSessionId, userId: ltiUser,  oauthNonce: ltiNonce}}
        );
    })
    .then(function(ltiSession) {

      // if we can't find an LtiSession with the given parameters, throw an error
      if(ltiSession === null) {
        return Promise.reject('No valid LTI session for {ltiSession: ' + ltiSessionId +', ltiUser: ' + ltiUser + ', ltiNonce: ' + ltiNonce + '}.\n' +
          'Try the following options:' +
          '\n1) Submit your solution again.' +
          '\n2) If resubmitting does not help, reload the page and try again (make sure to save your changes before reloading).' +
          '\n3) If the problem remains, please send this message to info@codeboard.io.');
      }
      else {
        // make the request that sends the grade
        return sendGrade(grade, ltiSession.lisResultSourcedid, ltiSession.lisOutcomeServiceUrl, _ltiKey, _ltiSecret);
      }

    })
    .then(function (res) {

      // if we got some error from the TC, report it.
      if(res[0].statusCode !== 200) {
       return Promise.reject('Error while submitting grade to LTI TC platform. Try to submit again or report the problem to info@codeboard.io: \n' + res[1]);
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
    .find(projectId)
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
    .find({where: {id: ltiSessionId, userId: ltiUserId, oauthNonce: ltiNonce}})
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


// export the service functions
exports.submitGradeToLtiToolConsumer = submitGradeToLtiToolConsumer;
exports.isLtiAllowedForProject = isLtiAllowedForProject;
exports.isValidLtiUserSession = isValidLtiUserSession;
exports.sendGrade = sendGrade;
