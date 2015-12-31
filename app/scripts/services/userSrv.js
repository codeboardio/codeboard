'use strict';

angular.module('codeboardApp')
  .service('UserSrv',['$rootScope', 'SessionRes', '$log', '$location', function UserService($rootScope, SessionRes, $log, $location) {

    var _isAuthenticated = false;
    var _username = '';

    this.getUsername = function() {
      return _username;
    }

    this.isAuthenticated = function () {
      return _isAuthenticated;
    }


    var setAuthenticatedUser = function(aUsername) {
      _username = aUsername;
      _isAuthenticated = true;
    }


    this.signOutUser = function() {
      SessionRes.remove( // Note: don't use the delete (which does the same) because its JS syntax being parsed on older Safari browsers
        function() {
          $location.path('/'); // send the user back to the home page
        }
      );
      _username = '';
      _isAuthenticated = false;
    }


    this.tryAuthenticateUser = function() {

      var username = '';

      SessionRes.get(
        function(data){
          setAuthenticatedUser(data.username);
          $rootScope.$broadcast('userLoggedIn');
        },
        function(error) {
          $log.debug('Cannot authenticate user; Status: ' + error.status);
        }
      );
    }

  }]);
