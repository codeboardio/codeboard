'use strict';

angular.module('codeboardApp')
  .controller('UserProjectsCtrl', ['$scope', '$rootScope', '$routeParams', '$http', '$location', '$route', 'UserSrv',
    function ($scope, $rootScope, $routeParams, $http, $location, $route, UserSrv) {

    /* Object that stores all the data of the user */
    $scope.user = {};

    /* Object that stores info about all the projects own by the user */
    $scope.ownerSet = {};

    /* Object that stores info about all the projects used by the user */
    $scope.userSet = {};

    /* Parameter that is true if the user is watching her own page, otherwise false; use to display buttons */
    $scope.currentUserIsSelf = false;

    /**
     * Function runs when the controller is loaded the first time.
     * Gets the user and user's project data from the server.
     */
    $scope.init = function() {

      $http.get('/api/users/' + $routeParams.username + '/projects')
        .success(function(data) {

          $scope.user = {
            // id
            username: data.username,
            name: data.name,
            email: data.emailPublic,
            url: data.url,
            location: data.location,
            institution: data.institution,
            imageUrl: data.imageUrl
          }

          $scope.ownerSet = data.ownerSet;

          $scope.userSet= data.userSet;

          $scope.currentUserIsSelf = (UserSrv.isAuthenticated() && data.username === UserSrv.getUsername());
        })
        .error(function(err) {
          // there was an error, most likely we didn't find the user, so we redirect to the 404
          $location.path('/404').replace();
        });
    }();

  }]);
