/**
 * Resources for functionality that is linked to the chat.
 *
 * @author Janick Michot
 */

'use strict';


angular.module('codeboardApp')

  .factory('ChatRes', ['$resource', function($resource) {
    return $resource(
      '/api/chat/:username/:projectId',
      {username: '@username', projectId: '@id'}
    );
  }]);
