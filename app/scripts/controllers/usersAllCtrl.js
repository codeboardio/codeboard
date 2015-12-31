'use strict';

angular.module('codeboardApp')
  .controller('usersAllCtrl', ['$scope', '$http', function($scope, $http) {

    // the users to display
    $scope.users = [];

    var init = function() {
      $http
        .get('/api/users')
        .success(function(data) {
          $scope.users = data;

        })
        .error(function(err) {

        });
    }();

  }]);
