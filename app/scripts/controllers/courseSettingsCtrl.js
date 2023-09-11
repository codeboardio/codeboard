'use strict';

/**
 * Created by mict on 16.08.2023
 */

angular.module('codeboardApp')
  .controller('CourseSettingsCtrl', ['$scope', '$http', '$log', '$routeParams', '$location', '$timeout', '$uibModal', 'CourseRes', 'courseData', 'CodeboardSrv',
    function ($scope, $http, $log, $routeParams, $location, $timeout, $uibModal, CourseRes, courseData, CodeboardSrv) {

      // Object that holds the properties of a course and binds to the form
      $scope.data = {};
      // keeps a copy of the original data that was sent from the server; used to discard any changes
      $scope.originalData = {};

      // get the course id from the current route (used in the header to link to the course's summary page)
      $scope.courseId = $routeParams.courseId;

      // Object's values are used to show success or failure message after saving data to server
      $scope.server = {
        saveSuccess: false,
        saveFailure: false,
        error: '',
        info: ''
      };

      // array of disabled actions
      $scope.actions = CodeboardSrv.actions;

      $scope.formatedProjectList = '';

      function getUserDisabledActions(courseOptions) {
        var actions = [];
        var userDisabledAction = courseOptions.find(item => item.option === 'userDisabledActions');
        if(userDisabledAction) {
          actions = userDisabledAction.value.split('|');
        }
        return actions;
      }

      /**
       * Function gets the courses data from the server and sets it up for display
       */
      $scope.init = function () {

        angular.copy(courseData, $scope.originalData);
        $scope.data = courseData;
        $scope.formatedProjectList = $scope.data.projectSet.map(project => project.id).join('|');

        // set possible and selected courses
        $scope.actionsSelected = getUserDisabledActions($scope.data.courseOptions);
      };
      $scope.init();

      $scope.discardChanges = function () {
        angular.copy($scope.originalData, $scope.data);
        $scope.actionsSelected = getUserDisabledActions($scope.data.courseOptions);
        $scope.formatedProjectList = $scope.data.projectSet.map(project => project.id).join('|');

      };

      $scope.save = function (form) {

        var courseId = $routeParams.courseId;

        if (form.$valid) {

          var payload = {
            coursename: $scope.data.coursename,
            description: $scope.data.description,
            contextId: $scope.data.contextId,
            courseOptions: {
              userDisabledActions: $scope.actionsSelected.join('|')
            },
            projectIds: $scope.formatedProjectList.split('|')
          };

          // hide user messages (in case they are displayed from a previous saving attempt)
          $scope.server.saveSuccess = false;
          $scope.server.saveFailure = false;

          $http.put('/api/courses/' + courseId + '/settings', payload)
            .then(function (result) {

              var prevProjectsIds = $scope.formatedProjectList.split('|');
              var invalidIds = prevProjectsIds.filter(id => !result.data.projectIds.includes(parseInt(id)));

              $scope.formatedProjectList = result.data.projectIds.join('|');

              // show the success message and remove it after 4 seconds
              $scope.server.saveSuccess = true;
              $timeout(function () {
                $scope.server.saveSuccess = false;
              }, 4000);

              $scope.server.info = "Invalid/Unkown ids has been removed: " + invalidIds.join(" ");

            }, function (error) {
              // show the error message and remove it after 4 seconds
              $scope.server.saveFailure = true;
              $scope.server.error = error.data.message;
            });
        }
      };


      /**
       * Toggle selection for courses
       * @param action
       */
      $scope.toggleSelection = function toggleSelection(action) {
        let idx = $scope.actionsSelected.indexOf(action);
        if (idx > -1) {
          $scope.actionsSelected.splice(idx, 1);
        }
        else {
          $scope.actionsSelected.push(action);
        }
      };


      /**
       * Deletes the current course.
       */
      var deleteCourse = function () {
        CourseRes.remove( { courseId: $routeParams.courseId },
          function () {
            $log.debug('Deletion ok');
            $location.url('/');
          },
          function () {
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
       * Function to open the modal where the user must confirm the deletion of a course
       */
      $scope.openDeletionModal = function () {

        var modalInstance = $uibModal.open({
          templateUrl: 'DeletionModalContent.html',
          controller: deletionModalInstanceCtrl
        });

        modalInstance.result.then(
          function () {
            $log.debug('User confirmed deletion of course.');
            deleteCourse();
          },
          function () {
            $log.debug('User canceled deletion of course.');
          });
      };
    }]);

