'use strict';

angular.module('codeboardApp')
  .controller('SupportCtrl', ['$scope', '$rootScope', '$http', '$routeParams', '$location',
    function ($scope, $rootScope, $http, $routeParams, $location) {

    $scope.data = {
      reqBody: '',
      outcomeServiceUrl: '',
      sourcedId: '',

      responseHeader: '',
      responseBody: '',
      responseStatusCode: 0
    }


    var init = function() {

      var _reqBody = JSON.parse(decodeURIComponent($routeParams.reqBody));

      var foo = ''
      for(var x in _reqBody) {
        foo = foo + x + '=' + _reqBody[x] + '\n';
      }


      $scope.data.reqBody = foo;

      $scope.data.outcomeServiceUrl = _reqBody.lis_outcome_service_url;
      $scope.data.sourcedId = _reqBody.lis_result_sourcedid;

    }();

    $scope.sendGrade = function(gradeValue) {

      var payload = {
        grade: gradeValue,
        lis_outcome_service_url: $scope.data.outcomeServiceUrl,
        lis_result_sourcedid: $scope.data.sourcedId
      }

      $http.put('/support/lti/debug/outcome', payload)
        .success(function(data, status, header, config) {

          $scope.data.responseStatusCode = data.statusCode;
          $scope.data.responseHeader = data.headers;
          $scope.data.responseBody = data.body;


        })
        .error(function(data, status, header, config) {

        });
    };


  }]);
