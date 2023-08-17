'use strict';

angular.module('codeboardApp')
  .controller('NavbarCtrl', ['$scope', '$location', 'UserSrv',
    function ($scope, $location, UserSrv) {

    $scope.username = UserSrv.getUsername();

    $scope.isAuth = UserSrv.isAuthenticated();

    /* Determines whether we are on the course page or not */
    $scope.isCoursePage = false;


    $scope.init = function () {
        $scope.isCoursePage = $location.path().includes('courses');
    };
    $scope.init();


    $scope.$on('userLoggedIn', function(event, args) {
      $scope.username = UserSrv.getUsername();
      $scope.isAuth = UserSrv.isAuthenticated();
    });


    $scope.signOut = function() {

      UserSrv.signOutUser();

//      console.log('Trying to log out');
//
//      $http.delete('/api/session').success(
//        function(data, status, header, config) {
//          $rootScope.currentUser = null;
//          $location.path('/'); // send the user back to the home page
//          console.log('user logged out: ' + data);
//        }
//      ).error(function(err) {
//          console.log(err);
//        })
    };
  }]);
