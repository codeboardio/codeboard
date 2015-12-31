/**
 * Created by hce on 7/25/14.
 *
 * A service for the resource that belongs the a user session.
 */

'use strict';

angular.module('codeboardApp')

  .factory('SessionRes', ['$resource', function($resource) {
    return $resource('/api/session');
  }])
