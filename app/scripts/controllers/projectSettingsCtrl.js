'use strict';

/**
 * Created by haches on 18.07.2014.
 *
 * Controller for administrating an object.
 * We assume that this controller is only loaded
 * if the current user is an owner of the project.
 * Nevertheless, the server must validate the
 * users authorization again before storing any changes.
 */

angular.module('codeboardApp')
  .controller('ProjectSettingsCtrl', ['$scope', '$http', '$log', '$routeParams', '$location', '$timeout', '$uibModal', 'ProjectRes', 'projectData',
    function ($scope, $http, $log, $routeParams, $location, $timeout, $uibModal, ProjectRes, projectData) {

      // Object that holds the properties of a project and binds to the form
      $scope.data = {};
      // keeps a copy of the original data that was send from the server; used to discard any changes
      $scope.originalData = {};

      // get the project id from the current route (used in the header to link to the project's summary page)
      $scope.projectId = $routeParams.projectId;

      // Object's values are used to show success or failure message after saving data to server
      $scope.server = {
        saveSuccess: false,
        saveFailure: false
      }

      /**
       * Function gets the projects data from the server and sets it up for display
       */
      $scope.init = function () {
        angular.copy(projectData, $scope.originalData);
        $scope.data = projectData;

        // if the controller is used for creating a new project, then 'projectData' is an empty project
        // and we need to create the ownerSet and userSet manually
        if (!$scope.data.ownerSet)
          $scope.data.ownerSet = [];
        if (!$scope.data.userSet)
          $scope.data.userSet = [];
      }();


      $scope.addOwners = function (aListOfNewOwnerNames) {
        $scope.data.ownerSet = _addMembers($scope.data.ownerSet, aListOfNewOwnerNames);

        // reset the input fields that contained the owner or user name
        $scope.input.newOwner = '';
      };


      $scope.addUsers = function (aListOfNewUserNames) {
        $scope.data.userSet = _addMembers($scope.data.userSet, aListOfNewUserNames);

        // reset the input fields that contained the owner or user name
        $scope.input.newUser = '';
      };


      var _addMembers = function (aArrayOfExistingMemberNames, aListOfNewMemberNames) {

        // split string of member names by comma
        var namesArray = aListOfNewMemberNames.split(',');

        // array to store the new members
        var newMembersArray = [];

        // trim all the member names, add them to the array
        for (var i = 0; i < namesArray.length; i++) {

          // trim the name from whitespaces
          var memberName = namesArray[i].trim();

          // if the name is not empty, add to the array
          if(memberName.length > 0) {
            newMembersArray.push({username: namesArray[i].trim()});
          }
        }

        // sorting function for the username objects
        var compareUsername = function(aUsernameObj1, aUsernameObj2) {
          if (aUsernameObj1.username < aUsernameObj2.username) {
            return -1;
          }
          if (aUsernameObj1.username > aUsernameObj2.username) {
            return 1;
          }
          return 0;
        };

        return (aArrayOfExistingMemberNames.concat(newMembersArray)).sort(compareUsername);
      };


      /**
       * Function to remove a member for the owner or user lists.
       * @param memberArray the array (e.g. ownerSet or userSet) from which to remove a member
       * @param memberName the name of the member to remove
       */
      $scope.removeMember = function (memberArray, memberName) {

        var index = -1;

        // find the index at which the member is stored
        for (var i in memberArray) {
          if (memberArray[i].username === memberName)
            index = i;
        }

        // remove the member
        memberArray.splice(index, 1);
      };


      $scope.discardChanges = function () {
        angular.copy($scope.originalData, $scope.data);
      };


      $scope.save = function (form) {

        var projectId = $routeParams.projectId;

        if (form.$valid) {

          var payload = {
            projectname: $scope.data.projectname,
            description: $scope.data.description,
            language: $scope.data.language,
            isPrivate: $scope.data.isPrivate,
            ownerSet: [],
            userSet: [],
            isSubmissionAllowed: $scope.data.isSubmissionAllowed,
            isLtiAllowed: $scope.data.isLtiAllowed,
            ltiKey: $scope.data.ltiKey,
            ltiSecret: $scope.data.ltiSecret
          }

          // we iterate over ownerSet and userSet to make sure we only submit the usernames and no other data
          for (var index in $scope.data.ownerSet)
            payload.ownerSet.push($scope.data.ownerSet[index].username);

          for (var index in $scope.data.userSet)
            payload.userSet.push($scope.data.userSet[index].username);


          // hide user messages (in case they are displayed from a previous saving attempt)
          $scope.server.saveSuccess = false;
          $scope.server.saveFailure = false;

          $http
            .put('/api/projects/' + projectId + '/settings', payload)
            .success(function (data, status, headers, config) {

              // show the success message and remove it after 4 seconds
              $scope.server.saveSuccess = true;
              $timeout(function () {
                $scope.server.saveSuccess = false;
              }, 4000);

            })
            .error(function (data, status, headers, config) {
              // show the error message and remove it after 4 seconds
              $scope.server.saveFailure = true;
            });
        }
      };


      /**
       * Deletes the current project.
       */
      var deleteProject = function () {

        ProjectRes.remove(
          {projectId: $routeParams.projectId},
          function (successValue) {
            $log.debug('Deletion ok');
            // the project deletion was successful, thus we now need to redirect the user from the settings page
            $location.url('/');
          },
          function (errorValue) {
            $log.debug('Deletion failed');
          }
        );
      };


      /**
       * The controller for the deletionModal
       */
      var deletionModalInstanceCtrl = ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {

        $scope.ok = function () {
          $uibModalInstance.close();
        };

        $scope.cancel = function () {
          $uibModalInstance.dismiss();
        };
      }];


      /**
       * Function to open the modal where the user must confirm the deletion of a project
       */
      $scope.openDeletionModal = function () {

        var modalInstance = $uibModal.open({
          templateUrl: 'DeletionModalContent.html',
          controller: deletionModalInstanceCtrl
        });

        modalInstance.result.then(
          function () {
            // the user clicked ok
            $log.debug('User confirmed deletion of project.');
            deleteProject();
          },
          function () {
            // the user canceled
            $log.debug('User canceled deletion of project.');
          });
      };
    }]);

