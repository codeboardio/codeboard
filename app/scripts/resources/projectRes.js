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

  .factory('ProjectRequestHelpRes', ['$resource', function($resource) {
    return $resource(
        '/api/projects/:projectId/helpRequests',
        {projectId: '@id'},
        {update: {method: 'PUT'}}
    );
  }])

  .factory('ProjectRes', ['$resource', function($resource) {
    return $resource(
        '/api/projects/:projectId',
        {projectId: '@id'},
        {update: {method: 'PUT'}}
    );
  }])

  .factory('initialProjectData', ['$q', 'initialLtiData', 'ProjectRes', function($q, initialLtiData, ProjectRes) {

    return function(projectId, courseId = null) {

      // usually we just request a project on '/api/projects/:projectId'
      // however, if the user belongs to an LTI session, we need to send the LTI data as part of the get-request
      // this way, the server will determine if the user is allowed to access a (private) project because of LTI overwrite

      return initialLtiData.then(function (ltiData) {

        // clone ltiData to use it as our payload
        let payload = Object.assign({}, ltiData);
        payload.projectId = projectId;
        payload.courseId = courseId;

        // return promise
        return ProjectRes.get(payload).$promise
            .then(function(_projectData) {
              // we reject the promise, when the request contains a courseId but no course is set
              if(courseId && typeof _projectData.course === "undefined") {
                return $q.reject('This project is not part of the course');
              } else {
                return _projectData;
              }
            });
      });
    };
  }]);
