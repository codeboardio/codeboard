/**
 * Created by Martin on 14/07/14.
 */

/**
 * This service calls the Mantra server (in Eiffel) and gets the
 * result of the compilation of a project
 * @param projectId
 * @param files
 * @param options
 */
var config = require('../config/config.js'),
  http = require('http'),
  url = require('url'),
  Promise = require('bluebird'),
  request = Promise.promisifyAll(require('request')); // use bluebird promises for requests


/**
 * Makes a POST request to the given url sending post_data as the request's payload.
 * @param {String} url must include port and path (for example cloudstudio.ethz.ch:9090/compile)
 * @param {Object} aPostData JSON data to send as part of the post request
 * @param {String} [aMantraNode=''] a value that will be send as a cookie in the the request
 * @returns {*|Promise} a blue bird promise
 */
var postRequestHTTP = function (url, aPostData, aMantraNode) {
  // make the post request, return a promise
  // Note: could use the get(1) shortcut to access the result of post request
  // see also: https://github.com/petkaantonov/bluebird/blob/master/API.md#getstring-propertyname---promise

  var headersContent = {};
  if(aMantraNode && aMantraNode.length > 0) {
    headersContent.cookie = config.mantra.cookieName + '=' + aMantraNode;
  }

  return request.postAsync({url: url, json: true, headers: headersContent, body: aPostData})
    .spread(function (res, resBody) {

      // handle the error cases
      if (res.statusCode >= 400) {
        // create an error object
        var errPayload = {
          statusCode: res.statusCode,
          msg: resBody.msg
        };

        // reject the promise
        return Promise.reject(errPayload);
      }
      else {

        // first we take care of any CoboMantraId load-balancing cookie
        var mantraNode = '';

        // get an array of strings with the property names in the response header
        var headerProperties = Object.keys(res.headers);
        // check if we find a 'set-cookie' header; HTTP header names are case insensitive
        for(var i = 0; i < headerProperties.length; i++) {

          if(headerProperties[i].toLowerCase() === 'set-cookie') {

            var cookiesToBeSet = res.headers[headerProperties[i]];


            for(var j = 0; j < cookiesToBeSet.length; j++) {
              if (cookiesToBeSet[j].indexOf(config.mantra.cookieName) === 0) {
                // found the cookie with name CoboMantraId

                // get the CoboMantraId cookie
                var mantraCookie = cookiesToBeSet[j];

                // get name and value of the cookie
                var cookieKey = mantraCookie.split('=')[0];
                var cookieVal = mantraCookie.split('=')[1];

                // split the value by '~' to access the part with mantra_node id
                mantraNode = cookieVal.indexOf('~') > -1 ? cookieVal.split('~')[0]: '';
              }
            }
          }
        }

        // next we construct the payload to send back
        var successPayload = {
          id: resBody.id
        };

        if (mantraNode && mantraNode !== '') {
          successPayload.id = mantraNode + '~' + resBody.id;
        }

        if(resBody.stream == false) {
          // the container was run on the server and we get an output here (no urls to attach or run etc.)
          successPayload.output = resBody.output;

          // in case of no-stream and compilation error, we need to forward that information
          // (needed for submissions as they do compile & run)
          if(resBody.hasOwnProperty('compilationError')){
            successPayload.compilationError = resBody.compilationError;
          }
        }
        else {
          // payload for the different Urls (still needs to be modified with the mantra_node)
          successPayload.streamUrl = config.codeboard.wsHostname + resBody.stream.pathname +  resBody.stream.search;
          successPayload.startUrl = '/api/startContainer' + resBody.start.pathname;
          successPayload.stopUrl = '/api/stopContainer' + resBody.stop.pathnam;

          if (mantraNode && mantraNode !== '') {
            successPayload.streamUrl += '&mantra=' + mantraNode;
            successPayload.startUrl += '?mantra=' + mantraNode;
            successPayload.stopUrl += '?mantra=' + mantraNode;
          }
        }

        return successPayload;
      }
    });
};


/**
 * Splits a mantraId. Behaves differently for different input
 * 1) input has a ~ symbol that separates the mantra_node_num and a mantraId (e.g. mantra_node1~myxxMantraId)
 * then it returns an object {mantraId: myxxMantraId, mantraNode: mantra_node1}
 * 2) input does not have a ~ (e.g. is only a simple mantra id such as myxxMantraId)
 * then it returns an object {mantraId: myxxMantraId, mantraNode: ''}
 * @param aMantraId {string} a mantra id that might contain a mantra_node info
 * @returns {{mantraId: string, mantraNode: string}}
 * @private
 */
 var _splitMantraId = function(aMantraId) {

   var result = {
     mantraId: '',
     mantraNode: ''
   };

   if (aMantraId && aMantraId !== '') {

     var lArray = aMantraId.split('~');
     if (lArray.length == 2) {
       result.mantraNode = lArray[0];
       result.mantraId = lArray[1];
     }
     else {
       result.mantraNode = '';
       result.mantraId = aMantraId;
     }
   }

   return result;
 };


/**
 * Invokes the Eiffel compilation and returns a promise
 * @param data: contains data.clean ; data.path ; data.id; data.target; and data.files
 * @returns {*|Promise} a bluebird promise
 */
var compile = function (data) {

  // the data.id might look like this: mantra_node1~mantraId
  // split the two values
  var idValues = _splitMantraId(data.id);

  // create the Url with the mantraId
  var url = config.mantra.url + ':' + config.mantra.port + '/' + idValues.mantraId;

  // return the promise that resolves when the compilation finishes and the server replies
  return postRequestHTTP(url, data, idValues.mantraNode);
};


/**
 * // TODO: could we merge this with the compile function? They do exactly the same
 * Executes command described in data.action (e.g. 'flatView', 'featureView', 'contractView', 'run') and returns a promise
 * @param data: contains data.id and data.action
 * @returns {*|Promise} a bluebird promise
 */
var executeCommand = function (data) {
  // the data.id might look like this: mantra_node1~mantraId
  // split the two values
  var idValues = _splitMantraId(data.id);

  // create the Url with the mantraId
  var url = config.mantra.url + ':' + config.mantra.port + '/' + idValues.mantraId;

  // return the promise that resolves when the compilation finishes and the server replies
  return postRequestHTTP(url, data, idValues.mantraNode);
};


var startContainer = function(aUrl, aMantraId, aContainerId) {


  // TODO: should we really parse the Url here? Or should we ask for the optional mantra_node instead?
  var urlObject = url.parse(aUrl, true);
  var mantraUrl = config.mantra.url + ':' + config.mantra.port + '/' + aMantraId + '/' + aContainerId + '/start';

  var lHeaders = {
    cookie :  config.mantra.cookieName + '=' + urlObject.query.mantra
  };

  return request.postAsync({url: mantraUrl, headers: lHeaders})
    .spread(function (res, resBody) {

      // handle the error cases
      if (res.statusCode >= 400) {
        // create an error object
        var errPayload = {
          statusCode: res.statusCode,
          msg: resBody.msg
        };

        // reject the promise
        return Promise.reject(errPayload);
      }
      else {
        var successPayload = {
          statusCode: res.statusCode,
          msg: res.statusMessage
        };
        return successPayload;
      }
    });
};

// TODO: consider having a single start/stop method; and don't construct the Url from scratch as it's provided by Mantra

var stopContainer = function(aUrl, aMantraId, aContainerId) {


  // TODO: should we really parse the Url here? Or should we ask for the optional mantra_node instaed?
  var urlObject = url.parse(aUrl, true);
  var mantraUrl = config.mantra.url + ':' + config.mantra.port + '/' + aMantraId + '/' + aContainerId + '/stop';

  var lHeaders = {
    cookie :  config.mantra.cookieName + '=' + urlObject.query.mantra
  };

  return request.postAsync({url: mantraUrl, headers: lHeaders})
    .spread(function (res, resBody) {

      // handle the error cases
      if (res.statusCode >= 400) {
        // create an error object
        var errPayload = {
          statusCode: res.statusCode,
          msg: resBody.msg
        };

        // reject the promise
        return Promise.reject(errPayload);
      }
      else {
        var successPayload = {
          statusCode: res.statusCode,
          msg: res.statusMessage
        };
        return successPayload;
      }
    });
};

exports.compile = compile;
exports.executeCommand = executeCommand;
exports.startContainer = startContainer;
exports.stopContainer = stopContainer;
