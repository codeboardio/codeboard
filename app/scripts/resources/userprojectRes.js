'use strict';

angular.module('codeboardApp')

  .factory('UserProjectRes', ['$resource', function($resource) {
    return $resource(
      '/api/projects/:projectId/userprojects/:userprojectId',
      {userprojectId: '@userprojectId', projectId: '@projectId'} // when doing non-post request, the :projectId is filled in through the id property of the project-object
    );
  }]);
