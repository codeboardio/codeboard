'use strict';

/**
 * Created by hce on 2/23/15.
 */


var ltiSrv = require('../services/ltiSrv.js'),
  oauthSignature = require('oauth-signature');


var initLtiSession = function(req, res) {

  /**
   * Function to check if a request from an LTI request for a project is authorized.
   * @param req the request that was send by the LTI tool consumer (e.g. edX or Moodle)
   * @return {boolean} returns true it the oauth_signature matches with the LTI settings
   */
  var isRequestAuthorized = function (req, ltiSecret) {

    // ge all the properties of the body, except for the one that's 'oauth_signature'
    var _parameters = {};

    for (var property in req.body) {
      if (property !== 'oauth_signature') {
        _parameters[property] = req.body[property];
      }
    }

    // for oauth we need the method that was used for this request
    var _httpMethod = req.method;


    // Note: usually we would get the protocol through 'req.protocol'; in production we're behind a load balancer and thus LTI TC's use https but req.protocol will be http
    var protocol = req.protocol;
    if(process.env.NODE_ENV && process.env.NODE_ENV === 'production') {
      protocol = 'https';
    }
    // for oauth we need the full url that was used for this request
    var _url = protocol + '://' + req.get('host') + req.originalUrl;

    // for oauth we need the secret from the database (the lti key is part of the request already)
    var _consumerSecret = ltiSecret;
    // for oauth we need to put the tokenSecret property, even if we don't use it
    var _tokenSecret = '';

    // generate the signature for the request
    var _encodedSignature = oauthSignature.generate(_httpMethod, _url, _parameters, _consumerSecret, _tokenSecret);

    // check if the signature of the request matches the signature we calculated
    // Note: we decode the percentage encoding of the the calculated signature
    return (req.body.oauth_signature === oauthSignature.Rfc3986.prototype.decode(_encodedSignature));
  };


  // check if request is authorized by knowing the key and secret
  if (!isRequestAuthorized(req, 'secret')) {

    // the caller is not an authorized LTI tool consumer
    Promise.reject('The project does not allow access via LTI or the provided key/secret combination is wrong.');
    res.json(401, {msg: 'You are not authorized to access this page.'});
  }
  else {
    var _reqBody = encodeURIComponent(JSON.stringify(req.body));

    // encode the userId so we can put is a URL parameter
    var _userId = encodeURIComponent(req.body.user_id);

    // return a redirect; this will trigger a 'get' request for the project with parameters about the user and lti session
    var _uriParams = encodeURI('ltiUserId=' + _userId + '&ltiNonce=' + req.body.oauth_nonce + '&reqBody=' + _reqBody);
    res.redirect('/support/lti/debug?' + _uriParams);
  }
};


var sendOutcome = function(req, res) {

  var _grade = req.body.grade;
  var _sourcedId = req.body.lis_result_sourcedid;
  var _url = req.body.lis_outcome_service_url;

  ltiSrv.sendGrade(_grade, _sourcedId, _url, 'coboLtiDebug', 'secret')
    .then(function(result, a, b, c) {

      // console.log('Grade send');

      var payload = {
        statusCode: result[0].statusCode,
        headers: JSON.stringify(result[0].headers),
        body: JSON.stringify(result[0].body)
      };

      res.json(200, payload);

    })
    .catch(function(err) {
      res.send(500, err.message);
    });

};



module.exports = {
  initLtiSession: initLtiSession,
  sendOutcome: sendOutcome
};
