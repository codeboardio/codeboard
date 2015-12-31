'use strict';

describe('Service: StatsSrv', function () {

  // load the service's module
  beforeEach(module('codeboardApp'));

  // instantiate service
  var StatsSrv;
  beforeEach(inject(function (_StatsSrv_) {
    StatsSrv = _StatsSrv_;
  }));


  describe('Testing sortAndAddMissingDates', function () {

    // start at date Dec. 01
    var startDate = new Date('12/1/2015');
    // stop at dat Dec. 10
    var endDate = new Date('12/10/2015');


    it('Should fill-in all days including startDate and endDate for an empty array', function () {

      // an empty array
      var testArray = [];

      // we want to test with an empty array
      (testArray.length).should.equal(0);

      // call the service function
      StatsSrv.sortAndAddMissingDates(startDate, endDate, testArray);

      // now the testArray should have length 10
      (testArray.length).should.equal(10);
    });


    it('Should fill-in days 02 - 10 if the array has data on startDate', function() {

      // the Array uses month with the "non-js" 1-Index, i.e. Dec = 12
      var testArray = [{_id: {year: 2015, month: 12, day: 1}, count: 5}];

      // we want to test with an array with 1 element
      (testArray.length).should.equal(1);

      StatsSrv.sortAndAddMissingDates(startDate, endDate, testArray);

      // now the testArray should have length 10
      (testArray.length).should.equal(10);

    });


    it('Should fill-in days 01 - 09 if the array has data on endDate', function() {

      // the Array uses month with the "non-js" 1-Index, i.e. Dec = 12
      var testArray = [{_id: {year: 2015, month: 12, day: 10}, count: 5}];

      // we want to test with an array with 1 element
      (testArray.length).should.equal(1);

      StatsSrv.sortAndAddMissingDates(startDate, endDate, testArray);

      // now the testArray should have length 10
      (testArray.length).should.equal(10);

    });


    it('Should fill-in days 02 - 09 if the array has data on startDate and endDate', function() {

      // the Array uses month with the "non-js" 1-Index, i.e. Dec = 12
      var testArray = [
        {_id: {year: 2015, month: 12, day: 10}, count: 5},
        {_id: {year: 2015, month: 12, day: 1}, count: 5},
      ];

      // we want to test with an array with 2 elements
      (testArray.length).should.equal(2);

      StatsSrv.sortAndAddMissingDates(startDate, endDate, testArray);

      // now the testArray should have length 10
      (testArray.length).should.equal(10);

    });


    it('Should fill-in days 01-02, 04-07, 09-10  if the array has two data points', function() {

      // the Array uses month with the "non-js" 1-Index, i.e. Dec = 12
      var testArray = [
        {_id: {year: 2015, month: 12, day: 8}, count: 5},
        {_id: {year: 2015, month: 12, day: 3}, count: 5},
      ];

      // we want to test with an array with 2 elements
      (testArray.length).should.equal(2);

      StatsSrv.sortAndAddMissingDates(startDate, endDate, testArray);

      // now the testArray should have length 10
      (testArray.length).should.equal(10);

    });


    it('Should fill-in a single missing day correctly', function() {

      // my own start and end dates
      var myStartDate = new Date('11/30/2015');
      var myEndDate = new Date('12/2/2015');

      // the Array uses month with the "non-js" 1-Index, i.e. Dec = 12
      var testArray = [
        {_id: {year: 2015, month: 11, day: 30}, count: 1},
        {_id: {year: 2015, month: 12, day: 2}, count: 1},
      ];

      // we want to test with an array with 2 elements
      (testArray.length).should.equal(2);

      StatsSrv.sortAndAddMissingDates(myStartDate, myEndDate, testArray);

      // now the testArray should have length 10
      (testArray.length).should.equal(3);
      // the day in position 1 of the array should be Dec. 1st
      testArray[1]._id.day.should.equal(1);
      testArray[1]._id.month.should.equal(12);
    });

  });

});
