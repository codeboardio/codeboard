'use strict';

angular.module('codeboardApp')

  .factory('ProjectSettingsRes', ['$resource', function($resource) {
    return $resource(
      '/api/projects/:projectId/settings',
      {projectId: '@id'} // when doing non-post request, the :projectId is filled in through the id property of the project-object
    );
  }])

  .factory('ProjectSummaryRes', ['$resource', function($resource) {
    return $resource(
      '/api/projects/:projectId/summary',
      {projectId: '@id'}
    );
  }])

  .factory('ProjectSubmissionRes', ['$resource', function($resource) {
    return $resource(
      '/api/projects/:projectId/submissions',
      {projectId: '@id'}
    );
  }])

  .factory('ProjectRes', ['$resource', function($resource) {
    return $resource(
      '/api/projects/:projectId',
      {projectId: '@id'},
      {update: {method: 'PUT'}}
    );
  }])
