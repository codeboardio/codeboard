'use strict';

/**
 * Created by haches on May 06 2015.
 * Angular controller for the password reset page.
 */

angular.module('codeboardApp')
  .controller('PasswordResetCtrl', ['$scope', '$rootScope', '$http', '$location', '$routeParams',
    function ($scope, $rootScope, $http, $location, $routeParams) {

      // the form's data
      $scope.formData = {};

      // initially the from is not submitted
      $scope.submitted = false;
      // when the form is under submission, we want to deactivate the submit button and not send another request
      $scope.isUnderSubmission = false;

      // object that's used to dynamically show/hide error and success information in the HTML template
      $scope.server = {
        resetSuccess: false,          // the password reset was successful
        errorUnknownFailure: false,   // there was an unkown error while trying to reset the password
        errorEmailUnknown: false      // the email address is not registered with Codeboard
      };


      /**
       * Sends the password reset request to the server.
       * @param {Object} formData the data from the form (has only the single property 'email')
       */
      $scope.resetPassword = function (formData) {

        // the user submitted the form, we're processing it
        $scope.submitted = true;
        // disable the submit button
        $scope.isUnderSubmission = true;

        // reset any error or success status that might be active from a previous submission
        $scope.server.resetSuccess = false;
        $scope.server.errorEmailUnknown = false;
        $scope.server.errorUnknownFailure = false;

        var payload = {
          email: formData.email
        }


        $http.put('/api/passwordreset', payload)
          .success(function (data, status, header, config) {

            // show the confirmation that a new password was send via email
            $scope.server.resetSuccess = true;
            // enable the submit button
            $scope.isUnderSubmission = false;

          })
          .error(function (data, status) {

            // enable the submit button
            $scope.isUnderSubmission = false;

            if (status === 403) {
              $scope.server.errorEmailUnknown = true;
            }
            else {
              $scope.server.errorUnknownFailure = true;
            }
          });
      };

    }]);
