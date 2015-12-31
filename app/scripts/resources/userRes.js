/**
 * Created by hce on 7/26/14.
 *
 * Resources for functionality that is linked to the user.
 *
 */

'use strict'


angular.module('codeboardApp')

  .factory('UserRes', ['$resource', function($resource) {
    return $resource(
      '/api/users/:username',
      {username: '@username'} // when doing non-post request, the :username is filled in through the id property of the user-object
    );
  }])

  .factory('UserResSettings', ['$resource', function($resource) {
    return $resource(
      '/api/users/:username/settings',
      {
        username: '@username'
      },
      {
        update: {method: 'PUT'}
      }
    );
  }])

  .factory('UsersAllRes', ['$resource', function($resource) {
    return $resource(
      '/api/users/'
    );
  }])
