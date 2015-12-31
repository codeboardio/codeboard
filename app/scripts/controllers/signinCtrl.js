'use strict';

angular.module('codeboardApp')
  .controller('SigninCtrl', ['$scope', '$rootScope', '$http', '$location', '$routeParams',
    function ($scope, $rootScope, $http, $location, $routeParams) {

    $scope.formData = {};
    $scope.signinFailed = false;

    // function to submit the form
    $scope.signin = function(formData) {

      $scope.submitted = true;

      var payload = {
        username: formData.username,
        password: formData.password
      }

      $http.post('/api/session', payload)
        .success(function(data, status, header, config) {

          if($routeParams.redirect) {
            // there's redirect information, so we redirect to that rather then the user's profile page
            $location.url($routeParams.redirect);
          }
          else {
            // redirect to the user page
            $location.path('/users/' + data.username);
          }
        })
        .error(function(data, status) {

          $scope.signinFailed = true;

          if(status === 401) {
            $scope.formData.error = 'Invalid username, email or password.';
          }
          else {
            $scope.formData.error = 'Unknown error. Please try again.';
          }
        });
      };

  }]);
