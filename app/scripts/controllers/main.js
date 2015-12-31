'use strict';

angular.module('codeboardApp')
  .controller('MainCtrl', ['$scope', '$rootScope', '$http', '$location', 'UserSrv',
    function ($scope, $rootScope, $http, $location, UserSrv) {

    $scope.authFailed = false;

    /**
     * Function that runs immediately when the controller is loaded.
     * Checks if the user is already authenticated. If yes,
     * the user is redirected to their user page.
     */
    $scope.init = function() {
      if(UserSrv.isAuthenticated())
        $location.path('/users/' + UserSrv.getUsername());
    }();


    /**
     * Function to login a user.
     * @param the data-model form the login form
     */
    $scope.login = function(formData) {

      // rest any error message
      $scope.authFailed = false;

      var payload = {
        username: formData.username,
        password: formData.password
      }

      $http
        .post('/api/session', payload)
        .success(function(data, status, header, config) {
          $location.path('/users/' + data.username);
        })
        .error(function(data, status, header, config) {
          console.log('Auth failed');
          $scope.authFailed = true;
        });
    };
  }]);
