'use strict';

angular.module('codeboardApp')
  .controller('MainCtrl', ['$scope', '$rootScope', '$http', '$location', 'UserSrv',
    function ($scope, $rootScope, $http, $location, UserSrv) {

    $scope.authFailed = false;
    $scope.isAuth = UserSrv.isAuthenticated();

    /**
     * Function that runs immediately when the controller is loaded.
     * Checks if the user is already authenticated. If yes,
     * the user is redirected to their user page.
     */
    $scope.init = function() {

        console.log(UserSrv.getUserRole() === 'user');
        console.log(UserSrv.getUserRole());

      if(UserSrv.isAuthenticated() && UserSrv.getUserRole() === 'user') {
          $location.path('/users/' + UserSrv.getUsername());
      }
    };
    $scope.init();

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
      };

      $http.post('/api/session', payload)
        .then(function(response) {
            $location.path('/users/' + response.data.username);
        }, function(error) {
          console.log('Auth failed');
          $scope.authFailed = true;
        });
    };
  }]);
