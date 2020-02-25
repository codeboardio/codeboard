'use strict';

var app = angular.module('codeboardApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'ngAnimate',
  'ui.ace',
  'angularTreeview',
  'angularScreenfull',
  'ui.bootstrap',
  'angularFileUpload',
  'ui.select',
  'ngGrid',
  'kendo.directives',
  'chart.js',
  'ngWebSocket',
  'luegg.directives' // angular-scroll-glue (make output automatically scroll to bottom when adding text, used in the IDE output element)
]);

// Optional configuration
app.config(['ChartJsProvider', function (ChartJsProvider) {
    // Configure all charts
    ChartJsProvider.setOptions({
      colours: [
        '#949FB1', // grey
        '#97BBCD', // blue
      ],
      responsive: true,
      maintainAspectRatio: false,
      pointHitDetectionRadius: 1
    });
  }]);

/**  Turn on/off the angular debugging; should be off when deployed */
app.config(['$logProvider', function($logProvider){
  $logProvider.debugEnabled(false);
}]);


app.config(['uiSelectConfig', function(uiSelectConfig) {
  uiSelectConfig.theme = 'selectize';
}]);


app.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'partials/main',
        controller: 'MainCtrl'
      })
      .when('/signin', {
        templateUrl: 'partials/signin',
        controller: 'SigninCtrl'
      })
      .when('/users/:username/settings/', {
        // shows the settings for :userId
        templateUrl: 'partials/userSettings',
        controller: 'UserSettingsCtrl',
        resolve: {
          userData: ['$route', 'UserResSettings', function($route, UserResSettings) {
            return UserResSettings.get({username: $route.current.params.username}).$promise;
          }]
        }
      })
      .when('/users/:username', {
        // shows the :userId page (non-public projects are included when user is authorized)
        templateUrl: 'partials/userProjects',
        controller: 'UserProjectsCtrl',
        resolve: {
          isAuth: ['UserSrv', function(UserSrv) {
            return UserSrv.isUserAuthForAdmin();
          }]
        }
      })
      .when('/courses/new', {
        // user creates a new project
        templateUrl: 'partials/courses/courseNew',
        controller: 'CourseNewCtrl',
        resolve: {
          isAuth: ['UserSrv', function(UserSrv){
            return UserSrv.isUserAuthForAdmin();
          }]
        }
      })
      .when('/projects/new', {
        // user creates a new project
        templateUrl: 'partials/projectNew',
        controller: 'ProjectNewCtrl',
        resolve: {
          isAuth: ['UserSrv', function(UserSrv) {
            return UserSrv.isUserAuthForAdmin();
          }]
        }
      })
      .when('/projects/:projectId/settings', {
        // allows to modify the general settings for :projectId (only accessible to project owners)
        templateUrl: 'partials/projectSettings',
        controller: 'ProjectSettingsCtrl',
        resolve: {
          projectData: ['$route', 'ProjectSettingsRes', function($route, ProjectSettingsRes) {
            return ProjectSettingsRes.get({projectId: $route.current.params.projectId}).$promise;
          }],
          courseSet: ['$route', '$http', 'UserSrv', function($route, $http, UserSrv) {
            return $http.get('/api/users/' + UserSrv.getUsername() + '/courses/owner')
                .then(function(result) {
                  return result.data.courseOwnerSet;
                });
          }]
        }
      })
      .when('/projects/:projectId/summary', {
        // TODO: shows the summary page of a project (publicly accessible if project is public)
        templateUrl: 'partials/projectSummary',
        controller: 'ProjectSummaryCtrl',
        resolve: {
          projectSummaryData: ['$route', 'ProjectSummaryRes', function($route, ProjectSummaryRes) {
            return ProjectSummaryRes.get({projectId: $route.current.params.projectId});
          }]
        }
      })
      .when('/projects/:projectId/stats', {
        templateUrl: 'partials/projectStats',
        controller: 'ProjectStatsCtrl',
        resolve: {
          // we don't inject any data but only check if the user is authorized to access this page
          placeHolder: ['$route', '$http', function($route, $http) {
            return $http.get('/api/projects/' + $route.current.params.projectId + '/authorizedownercheck');
          }]
        }
      })
      .when('/projects/:projectId/submissions', {
        templateUrl: 'partials/projectSubmissions',
        controller: 'ProjectSubmissionsCtrl',
        resolve: {
          // we don't inject any data but only check if the user is authorized to access this page
          placeHolder: ['$route', '$http', function($route, $http) {
            return $http.get('/api/projects/' + $route.current.params.projectId + '/authorizedownercheck');
          }]
        }
      })
      .when('/projects/:projectId/helpRequests', {
        templateUrl: 'partials/projectHelpRequests',
        controller: 'ProjectHelpRequestsCtrl',
        resolve: {
          // we don't inject any data but only check if the user is authorized to access this page
          placeHolder: ['$route', '$http', function($route, $http) {
            return $http.get('/api/projects/' + $route.current.params.projectId + '/authorizedownercheck');
          }]
        }
      })
      .when('/projects/:projectId/userprojects', {
        templateUrl: 'partials/projectUserProjects',
        controller: 'ProjectUserProjectsCtrl',
        resolve: {
          // we don't inject any data but only check if the user is authorized to access this page
          placeHolder: ['$route', '$http', function($route, $http) {
            return $http.get('/api/projects/' + $route.current.params.projectId + '/authorizedownercheck');
          }]
        }
      })

      .when('/courses/:courseId/:versionType', {
        templateUrl: 'partials/courses/courseVersionsAll',
        controller: 'CourseHelpRequestsCtrl',
        resolve: {
          initialData: ['$route', 'initialDataForCourseUserVersionsAll', function($route, initialDataForCourseUserVersionsAll) {
            return initialDataForCourseUserVersionsAll($route.current.params.courseId, $route.current.params.versionType);
          }]
        }
      })

      .when('/projects/:projectId', {
        // loads a project in the ide (publicly accessible if project is public)
        templateUrl: 'partials/ide',
        controller: 'IdeCtrl',
        resolve: {
          ltiData: ['$route', '$q', function($route, $q) {

            var deferred = $q.defer();
            var _ltiData = {};
            // try to extract the different lti parameter
            if ($route.current.params.ltiSessionId)
              _ltiData.ltiSessionId = $route.current.params.ltiSessionId;
            if($route.current.params.ltiUserId)
              _ltiData.ltiUserId = $route.current.params.ltiUserId;
            if($route.current.params.ltiNonce)
              _ltiData.ltiNonce = $route.current.params.ltiNonce;
            if($route.current.params.ltiReturnUrl)
              _ltiData.ltiReturnUrl = $route.current.params.ltiReturnUrl;

            deferred.resolve(_ltiData);
            return deferred.promise;
          }],
          projectData: ['$route', 'ProjectRes', function($route, ProjectRes) {

            // usually we just request a project on '/api/projects/:projectId'
            // however, if the user belongs to an LTI session, we need to send the LTI data as part of the get-request
            // this way, the server will determine if the user is allowed to access a (private) project because of LTI overwrite

            // returns an array with lti parameters
            var getLtiParameter = function() {
              var result = [];
              // try to extract the different lti parameter
              if ($route.current.params.ltiSessionId)
                result.push($route.current.params.ltiSessionId);
              if($route.current.params.ltiUserId)
                result.push($route.current.params.ltiUserId);
              if($route.current.params.ltiNonce)
                result.push($route.current.params.ltiNonce);
              // return the array
              return result;
            }

            // get the lti parameters
            var ltiParameters = getLtiParameter();
            if(ltiParameters.length == 3) {
              // we have 3 lti parameter, thus we append them as query parameters
              return ProjectRes
                .get(
                  {
                    projectId: $route.current.params.projectId,
                    ltiSessionId: ltiParameters[0],
                    ltiUserId: ltiParameters[1],
                    ltiNonce: ltiParameters[2]
                  })
                .$promise;
            }
            else {
              // we don't have any lti parameters, thus we don't need to forward them as query parameters
              return ProjectRes.get({projectId: $route.current.params.projectId}).$promise;
            }
          }]
        }
      })

      .when('/projects/:projectId/helprequests/:helpRequestId', {
        templateUrl: 'partials/ide',
        controller: 'IdeCtrl',
        resolve: {
          ltiData: ['$route', '$q', function ($route, $q) {
            let deferred = $q.defer();
            let _ltiData = {};
            deferred.resolve(_ltiData);
            return deferred.promise;
          }],
          projectData: ['$route', '$http', 'ideInitialDataForUserVersion', function($route, $http, ideInitialDataForUserVersion) {
            return ideInitialDataForUserVersion($route.current.params.projectId, $route.current.params.helpRequestId, 'helpRequests');
          }]
        }
      })
      .when('/projects/:projectId/submissions/:submissionId', {
        // loads a project in the ide (publicly accessible if project is public)
        templateUrl: 'partials/ide',
        controller: 'IdeCtrl',
        resolve: {
          ltiData: ['$route', '$q', function($route, $q) {
            var deferred = $q.defer();
            var _ltiData = {};
            deferred.resolve(_ltiData);
            return deferred.promise;
          }],
          projectData: ['$route', 'ideInitialDataForUserVersion', function($route, ideInitialDataForUserVersion) {
            return ideInitialDataForUserVersion($route.current.params.projectId, $route.current.params.submissionId, 'submissions');
          }]
        }
      })
      .when('/projects/:projectId/userprojects/:userprojectId', {
        // loads a version as stored by a user in the ide
        templateUrl: 'partials/ide',
        controller: 'IdeCtrl',
        resolve: {
          ltiData: ['$route', '$q', function($route, $q) {

            var deferred = $q.defer();
            var _ltiData = {};
            deferred.resolve(_ltiData);
            return deferred.promise;
          }],
          projectData: ['$route', 'UserProjectRes', function($route, UserProjectRes) {
              return UserProjectRes.get({projectId: $route.current.params.projectId, userprojectId: $route.current.params.userprojectId}).$promise;
          }]
        }
      })
      .when('/support/lti/debug', {
        templateUrl: 'partials/supportLtiDebug',
        controller: 'SupportCtrl'
      })
      .when('/404', {
        templateUrl: 'partials/404'
      })
      .when('/401', {
        templateUrl: 'partials/401'
      })
      .otherwise({
        redirectTo: '/404'
      });

    $locationProvider.html5Mode(true);
  }]);


app.run(['$rootScope', '$route', '$location', 'UserSrv',
  function($rootScope, $route, $location, UserSrv) {


  /**
   *
   */
  $rootScope.$on('$routeChangeStart', function(event, current, previous, rejection) {

    // the ide controller sets a function on onbeforeunload; we only want the in the IDE, nowhere else
    // so we reset it to null if the route changes to something different than an IDE route
    window.onbeforeunload = null;

    if(!UserSrv.isAuthenticated()) {
      UserSrv.tryAuthenticateUser();
    }
  });


  /**
   * Fetch errors that might occur when the routeProvider tries a 'resovle' before routing to a page.
   */
  $rootScope.$on('$routeChangeError', function(event, current, previous, rejection) {
    if(rejection.status === 401)
      $location.path('/401').replace();
    else
      $location.path('/404').replace(); // we put the replace here because then the back-button works (not state is put on the history)
  });

}]);

