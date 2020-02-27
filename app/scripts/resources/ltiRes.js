/**
 * LTI Resources
 *
 * @author Janick Michot
 */

'use strict';


angular.module('codeboardApp')

    .factory('initialLtiData', ['$route', '$q', function($route, $q) {

        // create promise that is returned
        var deferred = $q.defer();

        // create object that is returned in the promise
        var _ltiData = {};

        // try to extract the different lti parameter
        if($route.current.params.ltiSessionId) _ltiData.ltiSessionId = $route.current.params.ltiSessionId;
        if($route.current.params.ltiUserId) _ltiData.ltiUserId = $route.current.params.ltiUserId;
        if($route.current.params.ltiNonce) _ltiData.ltiNonce = $route.current.params.ltiNonce;
        if($route.current.params.ltiReturnUrl) _ltiData.ltiReturnUrl = $route.current.params.ltiReturnUrl;

        // resolve and return promise
        deferred.resolve(_ltiData);
        return deferred.promise;
    }]);
