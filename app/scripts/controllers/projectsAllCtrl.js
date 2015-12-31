'use strict';

angular.module('codeboardApp')
  .controller('projectsAllCtrl', ['$scope', '$http',
    function($scope, $http) {

      // the projectData is injected by the resolve in the router and gives us the first 10 projects to display
      $scope.data = {
        // the total count of how many projects are available (that match the serch terms)
        // this number can differ from the number of projects displayed
        count: 0,
        // array that has the data for displaying projects
        projects: [],
        // are the more projects that match the current criteria
        hasNext: false,
        // the uri from which to get the next projects' data
        next: '/api/projects'
      };

      // the project data for featured projects
      $scope.featuredData = {
        projects: []
      }

      // model for the search string that's bound to the input in the UI
      $scope.searchString = '';
      // we split the search string into terms; terms are then concatenated on the server
      $scope.searchTerms = [];


      // the init function initally loads the first project data to display
      var init = function() {

        $http
          .get('/api/projects')
          .success(function(result, status) {
             $scope.data = result;
          })
          .error(function(reason) {
            // what to do here?
          });

        $http
          .get('/api/projects/featured')
          .success(function(result, status) {
            $scope.featuredData = result;
          })
          .error(function(reason) {
            // what to do here?
          });

      }();





      /**
       * Function to send a request for projects that match the given search string
       * @param searchString
       */
      $scope.submitSearch = function(searchString) {

        // we remove any unnecessary spaces that might be part of the search string
        // first trim beginning and end of the string
        var cleanedSearchString = searchString.trim();
        // now remove any redundant spaces between words
        cleanedSearchString = cleanedSearchString.replace(/\s+/g, ' ');

        $http
          .get('/api/projects?search=' + encodeURIComponent(cleanedSearchString))
          .success(function(result, status) {

            // store the count and the projects' data
            $scope.data.count = result.count;
            $scope.data.projects = result.projects;
            $scope.data.hasNext = result.hasNext;
            $scope.data.next = result.next;
          })
          .error(function(reason) {

            // if we got a 422 and the user provided a search string,
            // we show an error message that says no projects exist that match the search terms
            if(reason.status === "422" && cleanedSearchString !== '') {
              // there are no projects, so we set the total count to 0
              $scope.data.count = 0;
              // the array of projects is empty
              $scope.data.projects = [];

              $scope.data.hasNext = false;
              $scope.data.next = '/api/projects';

              // the response from the server contains the terms that where used in the search
              // we assign them to the scope for displaying them to the user
              $scope.searchTerms = reason.searchTerms;
            }
          });
      };


      /**
       * Request more projects' data from the server
       */
      $scope.showMore = function() {

        if($scope.data.hasNext) {
          $http
            .get($scope.data.next)
            .success(function(result, status) {
              $scope.data.projects = $scope.data.projects.concat(result.projects);
              $scope.data.hasNext = result.hasNext;
              $scope.data.next = result.next;
            })
            .error(function(result, status) {
            })
        }
      };

      // display settings, used to show or hide the html for search-tab and feature-tab respectively
      $scope.display = {
        search: true,
        featured: false
      }


      /**
       * Change the display settings
       * @param viewName name of the view that should be become active (e.g. 'search' or 'featured')
       */
      $scope.setDisplay = function(viewName) {
        if(viewName === 'search') {
          $scope.display.search = true;
          $scope.display.featured = false;
        }
        if(viewName === 'featured') {
          $scope.display.search = false;
          $scope.display.featured = true;
        }
      }

    }]);
