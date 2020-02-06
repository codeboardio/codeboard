'use strict';

/**
 * Created by haches on 18.07.2014.
 *
 * Controller for administrating an object.
 * We assume that this controller is only loaded
 * if the current user is an owner of the project.
 * Nevertheless, the server must validate the
 * users authorization again before storing any changes.
 *
 */

angular.module('codeboardApp')
  .controller('ProjectStatsCtrl', ['$scope', '$log', '$route', '$http', 'StatsSrv',
    function ($scope, $log, $route, $http, StatsSrv) {


      // the model for "From" input box (default value: today - 1 month)
      $scope.fromDate = new Date();
      $scope.fromDate.setMonth($scope.fromDate.getMonth() - 1);

      // the model for the "Until" input box (default value: today)
      $scope.untilDate = new Date();

      // the latest date that a user can select in a date picker (default value: today)
      $scope.datePickerMaxSelectableDate = new Date();

      // date format for the date picker
      $scope.datePickerDateFormat = 'dd-MMMM-yyyy';

      // are the two date pickers open (false by default)
      $scope.datePickerFromOpen = false;
      $scope.datePickerUntilOpen = false;

      // get the projectId (to use as part of the link to the summary page)
      $scope.projectId = $route.current.params.projectId;


      // is data for displaying the graphs being loaded from the server (default yes as we load on startup)
      $scope.isLoadingCompilationRunGraphData = true;
      $scope.isLoadingUserAccessGraphData = true;


      // are the tables with detailed user data visible (default false)
      $scope.compilationRunTableVisible = false;
      $scope.projectAccessTableVisible = false;
      $scope.submissionTableVisible = false;

      // is data for the tables being loaded (default false)
      $scope.isLoadingCompilationRunDetails = false;
      $scope.isLoadingProjectAccessDetails = false;
      $scope.isLoadingSubmissionsDetails = false;


      $scope.compilationRunBtnLabel = "Show user details";
      $scope.projectAccessBtnLabel = "Show user details";
      $scope.submissionBtnLabel = "Show user details";



      // open the date picker for "From"
      $scope.openDatePickerFrom = function ($event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.datePickerFromOpen = true;
      };

      // open the date picker for "Until"
      $scope.openDatePickerUntil = function ($event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.datePickerUntilOpen = true;
      };

      // update the "From" input model with the value from the date picker
      $scope.updateFromDate = function () {
        if ($scope.fromDate > $scope.untilDate) {
          $scope.untilDate = new Date($scope.fromDate);
        }
        update();
      };

      // update the "Until" input model with the value from the date picker
      $scope.updateUntilDate = function () {
        if ($scope.fromDate > $scope.untilDate) {
          $scope.fromDate = new Date($scope.untilDate);
        }
        update();
      };


      /**
       * Given a source array with data, the function adds to the graph array the property .labels
       * which contains the labels for the x-axis of the graph
       *
       * Requires: graphArray.labels must exist and graphArray.labels = []
       *
       * @param aSourceArray {Array} contains elements of form {_id: {year:, month:, day:}, count: }
       * @param aGraphObject {Object} has property 'labels' that is an empty array; will be filled by running this function
       */
      var addLabelsToGraph = function (aSourceArray, aGraphObject) {

        // names of month for the x-axis labels
        var monthNames = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        // step-level defines if every data point on x-axis also get a label (default yes, thus value 1)
        var graphStepLevel = 1;
        // if x-axis has more than 20 points, not every point should get label
        // we recalculate the step-level based on number of points on x-axis
        if (aSourceArray.length > 20) {
          graphStepLevel = Math.ceil(aSourceArray.length / 20);
        }

        for (var i = 0; i < aSourceArray.length; i++) {
          if (i % graphStepLevel == 0) {
            // only set a labels at the graphStepLevel
            aGraphObject.labels.push(monthNames[aSourceArray[i]._id.month - 1] + " " + aSourceArray[i]._id.day);
          } else {
            aGraphObject.labels.push("");
          }
        }
      };


      /**
       * Adds a new line to the given graph object.
       * @param aSourceArray {Array} contains elements that contain property {count: }
       * @param aGraphObject {Object} has property 'data' that is an empty array;
       * function will push a new array as element that contains the y-data points for line
       */
      var addLineToGraph = function (aSourceArray, aGraphObject) {
        var dataNew = [];
        for (var i = 0; i < aSourceArray.length; i++) {
          dataNew.push(aSourceArray[i].count);
        }
        aGraphObject.data.push(dataNew);
      }


      /**
       * Displays the graph for number of compilations per day
       * Requires: $scope.compilerSummaryLogs has the data as {_id, count}
       */
      var drawCompilationRunGraph = function () {

        // object containing the data for rendering the graph for compilation and runs
        $scope.compileRunGraph = {
          labels: [],
          series: [],
          data: []
        };

        // sort the array for compilation logs and add the missing dates (which have a count of 0)
        StatsSrv.sortAndAddMissingDates($scope.fromDate, $scope.untilDate, $scope.compilerSummaryLogs);
        // sort the array for compilation logs and add the missing dates (which have a count of 0)
        StatsSrv.sortAndAddMissingDates($scope.fromDate, $scope.untilDate, $scope.compilerSummaryRunLogs);


        $scope.compileRunGraph.series.push('Compilations');
        addLineToGraph($scope.compilerSummaryLogs, $scope.compileRunGraph);

        $scope.compileRunGraph.series.push('Runs');
        addLineToGraph($scope.compilerSummaryRunLogs, $scope.compileRunGraph);

        addLabelsToGraph($scope.compilerSummaryLogs, $scope.compileRunGraph)
      };


      /**
       * Displays the graph for number project accesses per day
       * Requires: $scope.projectAccessPerDay has the data as {_id, count}
       */
      var drawProjectAccessGraph = function () {

        $scope.dataGraphUserAccess = {
          labels: [],
          series: [],
          data: []
        };

        // sort the array and add the missing dates (with value 0)
        StatsSrv.sortAndAddMissingDates($scope.fromDate, $scope.untilDate, $scope.projectAccessPerDay);

        $scope.dataGraphUserAccess.series.push('Project accesses');
        addLineToGraph($scope.projectAccessPerDay, $scope.dataGraphUserAccess);
        addLabelsToGraph($scope.projectAccessPerDay, $scope.dataGraphUserAccess);
      };

      /**
       * Requests the compilation and run summary per day for this project
       * and displays a graph
       */
      var getCompilationRunDataForGraph = function (){

        $scope.isLoadingCompilationRunGraphData = true;

        var projectId = $route.current.params.projectId;

        $http.get('/api/log/user/summaryProjectCompilationRunDay/' + projectId, {
          params: {
            startDateLogs: $scope.fromDate,
            endDateLogs: $scope.untilDate
          }
        })
          .then(function (aReply) {

            $scope.compilerSummaryLogs = aReply.compilerLogs;
            $scope.compilerSummaryRunLogs = aReply.compilerRunLogs;

            $scope.totalCompilationsDay = '(' + getTotal($scope.compilerSummaryLogs, 'count') + ')';
            $scope.totalRunsDay =  '(' + getTotal($scope.compilerSummaryRunLogs, 'count') + ')';

            drawCompilationRunGraph();
            $scope.isLoadingCompilationRunGraphData = false;

          }, function (reply) {
            $log.debug('Unable to get compile and run logs statistics (summary per day).');
          });
      };


      // queries the data for the summary of the project access and draws the graph
      var getProjectAccessDataForGraph = function () {

        $scope.isLoadingUserAccessGraphData = true;

        var projectId = $route.current.params.projectId;

        $http.get('/api/log/user/summaryProjectAccessDay/' + projectId, {
          params: {
            startDateLogs: $scope.fromDate,
            endDateLogs: $scope.untilDate
          }
        })
          .then(function (aReply) {
            $scope.projectAccessPerDay = aReply.projectAccessPerDay;
            $scope.totalAccessPerDay = '(' + getTotal($scope.projectAccessPerDay, 'count') + ')';
            drawProjectAccessGraph();
            $scope.isLoadingUserAccessGraphData = false;

          }, function (reply) {
          });
      };


      /**
       * Hides/shows the table with details of the compilation/run for each user
       */
      $scope.hideShowCompilationRunTable = function () {
        $scope.compilationRunTableVisible = !$scope.compilationRunTableVisible;
        if ($scope.compilationRunTableVisible) {
          $scope.compilationRunBtnLabel = "Hide user details";
          getCompilationRunDataForTable();
        }
        else {
          $scope.compilationRunBtnLabel = "Show user details";
        }
      };


      /**
       * Hides/shows the table with details of the project accesses for each user
       */
      $scope.hideShowProjectAccessDetails = function () {
        $scope.projectAccessTableVisible = !$scope.projectAccessTableVisible;
        if ($scope.projectAccessTableVisible) {
          $scope.projectAccessBtnLabel = "Hide user details";
          getProjectAccessDataForTable();
        }
        else {
          $scope.projectAccessBtnLabel = "Show user details";
        }
      };


      /**
       * Hides/shows the table with details of the submissions for each user
       */
      $scope.hideShowSubmissionsDetails = function () {
        $scope.submissionTableVisible = !$scope.submissionTableVisible;
        if ($scope.submissionTableVisible) {
          $scope.submissionBtnLabel = "Hide user details";
          getSubmissionDataForTable();
        }
        else {
          $scope.submissionBtnLabel = "Show user details";
        }

      };


      // Variables used for pagination
      $scope.currentPageProjectAccess = 0;
      $scope.currentPageCompilations = 0;
      $scope.currentPageRuns = 0;
      $scope.currentPageSubmissions = 0;
      $scope.numPerPage = 10;
      $scope.maxSizePage = 10;
      $scope.filteredProjAccesses = [];
      $scope.filteredCompilations = [];
      $scope.filteredRuns = [];
      $scope.filteredSubmissions = []


      /**
       * Function to filter the page taking the current page number
       * the original array with data and returns the filtered array
       */
      $scope.pageChanged = function (pageNum, originalArray) {
        var begin = (pageNum - 1) * $scope.numPerPage;
        var end = begin + $scope.numPerPage;
        if (originalArray!= undefined) {
          return originalArray.slice(begin, end);
        }
        else {
          return [];
        }
      };


      /**
       * Function to update the information of the pagination for compilations stats (per user)
       */
      $scope.pageCompilationChanged = function() {
        $scope.filteredCompilations = $scope.pageChanged ($scope.currentPageCompilations,$scope.compilationStats)
      };


      /**
       * Function to update the information of the pagination for run stats (per user)
       */
      $scope.pageRunsChanged = function() {
        $scope.filteredRuns = $scope.pageChanged ($scope.currentPageRuns,$scope.runStats)
      };


      /**
       * Function to update the information of the pagination for project accesses (per user)
       */
      $scope.pageProjectAccessChanged = function() {
        $scope.filteredProjAccesses = $scope.pageChanged ($scope.currentPageProjectAccess,$scope.accessStats)
      };


      /**
       * Function to update the information of the pagination for submissions (per user)
       */
      $scope.pageSubmissionsChanged = function() {
        $scope.filteredSubmissions = $scope.pageChanged ($scope.currentPageSubmissions,$scope.submissionStats)
      };


      /**
       * Auxiliary function to sort the stats
       *
       */
      var sortStats = function (arr) {
        arr.sort(function (a, b) {
          // Turn your strings into dates, and then subtract them
          // to get a value that is either negative, positive, or zero.
          if (a._id < b._id) return -1;
          if (a._id > b._id) return 1;
          return 0;
        });
      };


      /**
       * Function to return the sum of all values stored in an array under "propertyname".
       * @param inputArray the array over which to iterate
       * @param propertyName the name of the property of each array element that should be summed
       * @return {number} the total sum
       */
      var getTotal = function(inputArray, propertyName) {
        var result = 0;

        for(var i = 0; i < inputArray.length; i++) {
          result += inputArray[i][propertyName];
        }

        return result;
      }


      /**
       * gets the stats about compilations and runs aggregated by user
       */
      var getCompilationRunDataForTable = function() {
        $scope.isLoadingCompilationRunDetails = true;

        var projectId = $route.current.params.projectId;

        $http.get('/api/log/user/summaryCompiler/'+projectId, {
          params: {
            startDateLogs: $scope.fromDate,
            endDateLogs: $scope.untilDate
          }
        }).
          success(function (success) {
            $scope.compilationStats = success.compilerLogs;
            $scope.runStats = success.compilerRunLogs;

            $scope.totalCompilations = getTotal($scope.compilationStats, 'countProjectAccess');
            $scope.totalRuns = getTotal($scope.runStats, 'countProjectAccess');

            sortStats($scope.compilationStats);
            sortStats($scope.runStats);

            $scope.currentPageCompilations = 1;
            $scope.pageCompilationChanged();

            $scope.currentPageRuns = 1;
            $scope.pageRunsChanged();

            $scope.isLoadingCompilationRunDetails = false;
          }).
          error(function (reply) {
            $log.debug('Unable to get compile and run logs statistics.');
          });
      };


      /**
       * Gets from the server the project access data for the starting
       * and ending dates
       */
      var getProjectAccessDataForTable = function () {
        $scope.isLoadingProjectAccessDetails = true;
        var projectId = $route.current.params.projectId;
        $http.get('/api/log/user/summaryProjectAccess/' + projectId, {
          params: {
            startDateLogs: $scope.fromDate,
            endDateLogs: $scope.untilDate
          }
        }).
          success(function (success) {
            $scope.accessStats = success.projectAccess;
            $scope.totalAccesses = getTotal($scope.accessStats, 'countProjectAccess');

            sortStats($scope.accessStats);

            $scope.currentPageProjectAccess = 1;
            $scope.pageProjectAccessChanged();

            $scope.isLoadingProjectAccessDetails = false;
          }).
          error(function (reply) {
            $log.debug('Unable to get compile and run logs statistics.');
          });
      };


      /**
       * Gets from the server the details of the submissions for the starting
       * and ending dates
       */
      var getSubmissionDataForTable = function () {
        $scope.isLoadingSubmissionsDetails = true;

        var projectId = $route.current.params.projectId;
        $http.get('/api/log/user/summarySubmitAccess/' + projectId, {
          params: {
            startDateLogs: $scope.fromDate,
            endDateLogs: $scope.untilDate
          }
        }).
          success(function(success) {
            $scope.submissionStats = success.submitLogs;
            $scope.totalSubmissions = getTotal($scope.submissionStats, 'countProjectAccess');

            sortStats($scope.submissionStats);

            $scope.currentPageSubmissions = 1;
            $scope.pageSubmissionsChanged();

            $scope.isLoadingSubmissionsDetails = false;

          })
          .error(function(err) {
            $log.debug('Unable to get submission statistics.');
          });
      };



      /**
       * Updates the data when the starting or ending dates are changed
       */
      var update = function () {

        // check that the date models actually have a value; might be empty if e.g. user click "clear" in date picker
        if ($scope.fromDate && $scope.untilDate) {

          getCompilationRunDataForGraph();
          getProjectAccessDataForGraph();

          // update the table with compilation details if it's displayed
          if ($scope.compilationRunTableVisible) {
            getCompilationRunDataForTable();
          }

          // update the table with project access details if it's displayed
          if ($scope.projectAccessTableVisible) {
            getProjectAccessDataForTable();
          }

          // update the table with submissions details if  it's displayed
          if ($scope.submissionTableVisible) {
            getSubmissionDataForTable();
          }
        }
      };

      // run update the first time the script is parsed
      update();
}]);
