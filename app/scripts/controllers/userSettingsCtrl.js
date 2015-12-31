'use strict';

angular.module('codeboardApp')
  .controller('UserSettingsCtrl',
  ['$scope', '$upload', '$routeParams', '$http', '$timeout', '$log', 'UserResSettings', 'userData',
    function($scope, $upload, $routeParams, $http, $timeout, $log, UserResSettings, userData) {

      $scope.data = userData;

      // Object's values are used to show success or failure message after saving data to server
      $scope.server = {
        saveSuccess: false,
        saveFailure: false
      };

      $scope.save = function(formData) {

        var payload = {
          email: formData.email,
          emailPublic: formData.emailPublic,
          name: formData.name,
          url: formData.url,
          institution: formData.institution,
          location: formData.location
        };


        // the promise API is .then(successCallback, errorCallback, notifyCallback)
        UserResSettings.update({username: $routeParams.username}, payload)
          .$promise.then(
          function(usr) {
            // show the success message and remove it after 4 seconds
            $scope.server.saveSuccess = true;
            $timeout(function() {
              $scope.server.saveSuccess = false;
            }, 4000);
          }),
          function(error) {
            $scope.server.saveFailure = true;
            $log.debug(error);
          }
      };

      $scope.onFileSelect = function($files) {
        //$files: an array of files selected, each file has name, size, and type.
        for(var i = 0; i < $files.length; i++) {
          var file = $files[i];
          $scope.upload = $upload.upload({


            url: '/api/users/' + $routeParams.username + '/settings/userImage', //upload.php script, node.js route, or servlet url
            //method: 'POST' or 'PUT',
            //headers: {'header-key': 'header-value'},
            //withCredentials: true,
            data: {myObj: $scope.myModelObj},
            file: $files // or list of files ($files) for html5 only
            //fileName: 'doc.jpg' or ['1.jpg', '2.jpg', ...] // to modify the name of the file(s)
            // customize file formData name ('Content-Desposition'), server side file variable name.
            //fileFormDataName: myFile, //or a list of names for multiple files (html5). Default is 'file'
            // customize how data is added to formData. See #40#issuecomment-28612000 for sample code
            //formDataAppender: function(formData, key, val){}
          }).progress(function(evt) {
            console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
          }).success(function(data, status, headers, config) {
            // file is uploaded successfully
            console.log(data);

            // set the imageUrl to the new path
            $scope.data.imageUrl = data.imageUrl;
          });
          //.error(...)
          //.then(success, error, progress);
          // access or attach event listeners to the underlying XMLHttpRequest.
          //.xhr(function(xhr){xhr.upload.addEventListener(...)})
        }
      };
    }]);


angular.module('codeboardApp')
  .controller('UserSettingsPasswordCtrl',
  ['$scope', '$routeParams', '$http', '$timeout', '$log',
    function($scope, $routeParams, $http, $timeout, $log) {

      // has the password been submitted yet?
      $scope.passwordSubmitted = false

      // was the "current password" incorrect?
      $scope.invalidCurrentPassword = false;

      // object to keep track if the http request was successful
      // Object's values are used to show success or failure message after saving data to server
      $scope.pserver = {
        saveSuccess: false,
        saveFailure: false
      };

      /**
       * Function that makes the http call to update the password.
       * @param data (the data from the from)
       */
      $scope.updatePassword = function(data) {

        // setting all the states for info dialogs and validation
        $scope.pserver.saveSuccess = false;
        $scope.pserver.saveFailure = false;
        $scope.invalidCurrentPassword = false;
        $scope.passwordSubmitted = true;

        if($scope.changePasswordForm.$valid && (data.newPassword === data.newPasswordConfirm)) {

          var payload = {
            currentPassword: data.currentPassword,
            newPassword: data.newPassword
          };

          $http
            .put(
            '/api/users/' + $routeParams.username + '/settings/password',
            payload)
            .success(function(data, status, header, config) {
              // show the success message and remove it after 4 seconds
              $scope.pserver.saveSuccess = true;
              // reset the ng-model to make the inputs empty
              $scope.formModel = {};
              // by settings pwdSubmitted to false, we disable the min-length check
              // and get nice clean white input boxes
              $scope.passwordSubmitted = false;

              $timeout(function() {
                // make the saveSuccess info dialog disappear
                $scope.pserver.saveSuccess = false;
              }, 8000);
            })
            .error(function(data, status, header, config) {
              $log.debug(status + " error:" + data.msg);

              // mae the saveFailure info dialog appear
              $scope.pserver.saveFailure = true;
              // the server returns a 403 if the "current pwd" was incorrect
              if(status === 403) {
                $scope.invalidCurrentPassword = true;
              }
            });
        }
      }
    }]);
