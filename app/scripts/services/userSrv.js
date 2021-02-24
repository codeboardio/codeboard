'use strict';

angular.module('codeboardApp')
  .service('UserSrv',['$rootScope', '$q', 'SessionRes', '$log', '$location', function UserService($rootScope, $q, SessionRes, $log, $location) {

    var _isAuthenticated = false;
    var _username = '';
    var _userrole = '';

    this.getUsername = function() {
      return _username;
    };

    this.getUserRole = function() {
        return _userrole;
    };

    this.isAuthenticated = function () {
      return _isAuthenticated;
    };


    var setAuthenticatedUser = function(aUsername, aRole) {
      _username = aUsername;
      _userrole = aRole;
      _isAuthenticated = true;
    };


    this.signOutUser = function() {
      SessionRes.remove( // Note: don't use the delete (which does the same) because its JS syntax being parsed on older Safari browsers
        function() {
          $location.path('/'); // send the user back to the home page
        }
      );
      _username = '';
      _isAuthenticated = false;
    };


    /**
     * Method that checks id a user is authenticated.
     * If isAuthRequired is set to true, redirect to home page
     * @param isAuthRequired
     * @returns {*}
     */
    this.tryAuthenticateUser = function(isAuthRequired) {

        var defer = $q.defer();

        SessionRes.get(
            function(data){
                setAuthenticatedUser(data.username, data.role);
                $rootScope.$broadcast('userLoggedIn');

                if(data.role !== 'user' && isAuthRequired) {
                    defer.reject({status: 401});
                }
                defer.resolve();
            },
            function(error) {
                $log.debug('Cannot authenticate user; Status: ' + error.status);
                if(isAuthRequired) {
                    defer.reject({status: 401});
                }
                defer.resolve();
            }
        );

        return defer.promise;
    };

  }]);
