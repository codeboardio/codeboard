'use strict';

angular.module('codeboardApp')
  .controller('SignupCtrl', ['$scope', '$rootScope', '$http', '$location',
    function ($scope, $rootScope, $http, $location) {

    $scope.data = {};
    $scope.serverError = {
      userExists: false,
      emailExists: false,
      hasErrors: false,
      errorMsg: ''
    }

    // will be set to true once a user tried to submit the form; use to enable the displaying of form validation errors
    $scope.submitted = false;

    // will be set to true once we've submitted and are waiting for the server to get back to us; used to prevent multiple submissions
    $scope.currentlySubmitting = false;

    // function to submit the form after all validation has occurred
    $scope.register = function(form) {

        $scope.submitted = true;

        // check to make sure the form is completely valid and we're not currently submitting
        if (form.$valid && $scope.data.password === $scope.data.passwordConfirm && $scope.currentlySubmitting === false) {

          $scope.currentlySubmitting = true;

          var payload = {
            username: $scope.data.username,
            password: $scope.data.password,
            email: $scope.data.email
          };

          $http.post('/api/users', payload)
            .then(function(data) {
              $scope.serverError.userExists = false;
              $scope.serverError.emailExists = false;

              $scope.currentlySubmitting = false;

              // we try to login the user immediately after the signup
              $http.post('/api/session',
                {
                  username: $scope.data.username,
                  password: $scope.data.password
                })
                .then(function(data) {
                  $location.path('/users/' + data.username);
                });
            }, function(err) {

              if(err.status === 422) {
                // probably failed the server side validation
                $scope.serverError.hasErrors = true;
                $scope.serverError.errorMsg = err.msg;
              }
              else if(err.status === 409) {
                // username or email might already exist
                if(err.data.error === 'UserExists') {
                  $scope.serverError.userExists = true;
                }
                if(err.data.error === 'EmailExists') {
                  $scope.serverError.emailExists = true;
                }
              }
              else {
                // some other error occurred on the server
                $scope.serverError.hasErrors = true;
                $scope.serverError.errorMsg = err.data.msg;
              }

              $scope.currentlySubmitting = false;
            });
        }
      };
  }]);
