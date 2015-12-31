/**
 * StatsSrv is a service that provides functionality
 * that's used to render the graphs on the projects' stats page
 *
 * Created by Martin on 13/10/15.
 *
 */
'use strict';

angular.module('codeboardApp')
  .service('StatsSrv', function StatsSrv() {


    /**
     * Returns a new date that is aNumOfDaysAfter days after the given date aDate.
     * @param aDate {Date} the date from which to add days
     * @param aNumOfDaysAfter {Number} number of days the new date should be after aDate
     * @returns {Date} the new date that is aNumOfDaysAfter days after aDate
     */
    var getDateNDaysAfter = function (aDate, aNumOfDaysAfter) {
      // create a new date based on aDate
      var result = new Date(aDate.getTime());
      // add the given number of days to 'result' date
      result.setDate(result.getDate() + aNumOfDaysAfter);

      return result;
    }


    /**
     * Returns a new date that is aNumOfDaysBefore days before the given date aDate.
     * @param aDate {Date} the date from which to subtract days
     * @param aNumOfDaysBefore {Number} number of days the new date should be after aDate
     * @returns {Date} the new date that is aNumOfDaysBefore days after aDate
     */
    var getDateNDaysBefore = function (aDate, aNumOfDaysBefore) {
      return getDateNDaysAfter(aDate, -(aNumOfDaysBefore));
    };


    /**
     * Adds into aArray new dates between aStartDate and aStopDate (including both boundary dates).
     * The inserted object is an object {_id: {year:, month:, day:}, count: 0}.
     * @param aStartDate {Date} first date that should be in the array
     * @param aStopDate {Date} last date that should be in the array
     * @param aArray {Array} the array to fill with elements (where they are missing)
     */
    var addMissingDates = function (aStartDate, aStopDate, aArray) {

      var currentDate = aStartDate;

      while (currentDate <= aStopDate) {
        var d = {
          _id: {
            year: currentDate.getFullYear(),
            month: currentDate.getMonth() + 1,
            day: currentDate.getDate()
          },
          count: 0
        };

        aArray.push(d);
        currentDate = getDateNDaysAfter(currentDate, 1);
      }
    }


    /**
     * Sorts the given Array and adds elements of form {_id: {year:, month:, day:}, count: 0} with the appropriate
     * date if that date is missing in the array.
     *
     * Requires: if aArray has elements, the satisfy object structure {_id: {year:, month:, day:}}
     *
     * @param aStartDateLogs {Date} the first date should be in the array (when this function is done)
     * @param aEndDateLogs {Date} the last date should be in the array (when this function is done)
     * @param aArray {Array} array that may contain elements that satisfy object structure {_id: {year:, month:, day:}}
     */
    var sortAndAddMissingDates = function (aStartDateLogs, aEndDateLogs, aArray) {

      // Inner function implementing a comparison for two Array elements; used to sort the Array.
      var compareArrayElemsByDate = function (a, b) {
        // create dates and then subtract them to get a value that is either negative, positive, or zero
        return new Date(a._id.year, a._id.month - 1, a._id.day) - new Date(b._id.year, b._id.month - 1, b._id.day);
      }

      // sort the dates in the array
      aArray.sort(compareArrayElemsByDate);

      var aArrayLength = aArray.length;
      var milliSecsInADay = 86400000;

      // if empty, then add all dates between start and end
      if (aArrayLength == 0) {
        addMissingDates(aStartDateLogs, aEndDateLogs, aArray);
      }
      else {

        // add the missing dates between StartDate and the first element
        var firstDateInArray = new Date(aArray[0]._id.year, aArray[0]._id.month - 1, aArray[0]._id.day);

        if (firstDateInArray - aStartDateLogs >= milliSecsInADay) {

          // get the day before the first date in the array
          var dayBeforeFirstDateInArray = getDateNDaysBefore(firstDateInArray, 1);

          addMissingDates(aStartDateLogs, dayBeforeFirstDateInArray, aArray);
        }

        // add the missing dates between last element and the endDate
        var lastDateInArray = new Date(aArray[aArrayLength - 1]._id.year, aArray[aArrayLength - 1]._id.month - 1, aArray[aArrayLength - 1]._id.day);
        if (aEndDateLogs - lastDateInArray >= milliSecsInADay) {

          // get the day after the last date in the array
          var dayAfterLastDateInArray = getDateNDaysAfter(lastDateInArray, 1);

          addMissingDates(dayAfterLastDateInArray, aEndDateLogs, aArray);
        }
      }

      for (var i = 0; i < aArrayLength - 1; i++) {

        var dateInArray = new Date(aArray[i]._id.year, aArray[i]._id.month - 1, aArray[i]._id.day);
        var nextDateInArray = new Date(aArray[i + 1]._id.year, aArray[i + 1]._id.month - 1, aArray[i + 1]._id.day);

        if (nextDateInArray - dateInArray >= milliSecsInADay) {

          // get the day after and the day before the dates in the array
          var dayAfterDateInArray = getDateNDaysAfter(dateInArray, 1);
          var dayBeforeNextDateInArray = getDateNDaysBefore(nextDateInArray, 1)

          addMissingDates(dayAfterDateInArray, dayBeforeNextDateInArray, aArray);
        }
      }

      // sort again after we've added all the missing dates to the array
      aArray.sort(compareArrayElemsByDate);
    };


    // the return object, exposing the public functions of this service
    return {
      sortAndAddMissingDates: sortAndAddMissingDates
    };

  });
