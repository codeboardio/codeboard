/**
 * Created by hce on 2/4/15.
 *
 * Test cases for the server's project service: projectSrv.
 */


var env = process.env.NODE_ENV = 'test';

var projectSrv = require('../../../lib/services/projectSrv.js'),
  expect = require('expect.js');

describe('Test extraction of results from result string', function() {

  it('Basic extraction of results', function() {
    var inputString = '<!--@test=1;1;1;-->';
    var results = projectSrv.extractTestResult(inputString);

    expect(results[0]).to.be('1');
    expect(results[1]).to.be('1');
    expect(results[2]).to.be('1');
  });


  it('Check for decimal numbers', function() {
    var inputString = '<!--@test=1.732;13;.3;-->';
    var results = projectSrv.extractTestResult(inputString);

    expect(results[0]).to.be('1.732');
    expect(results[1]).to.be('13');
    expect(results[2]).to.be('.3');
  });


  it('Extract from end', function() {
    var inputString = '<!--@test=1;1;1;-->Something in between<!--@test=2;2;2;-->';
    var results = projectSrv.extractTestResult(inputString);

    expect(results[0]).to.be('2');
    expect(results[1]).to.be('2');
    expect(results[2]).to.be('2');
  });


  it('Newline at the end', function() {
    var inputString = '<!--@test=1;1;1;-->Something in between<!--@test=2;2;2;-->\n';
    var results = projectSrv.extractTestResult(inputString);

    expect(results[0]).to.be('2');
    expect(results[1]).to.be('2');
    expect(results[2]).to.be('2');
  });


  it('Multiple newlines at the end', function() {
    var inputString = '<!--@test=1;1;1;-->Something in between<!--@test=2;2;2;-->\n\n\n\n';
    var results = projectSrv.extractTestResult(inputString);

    expect(results[0]).to.be('2');
    expect(results[1]).to.be('2');
    expect(results[2]).to.be('2');
  });


  it('Multiple result strings, only last one is used', function() {
    var inputString = '<!--@test=1;1;1;-->Some more\n<!--@test=2;2;2;-->\nSome more text\n<!--@test=3;3;3;-->\n';
    var results = projectSrv.extractTestResult(inputString);

    expect(results[0]).to.be('3');
    expect(results[1]).to.be('3');
    expect(results[2]).to.be('3');
  });


  it('Missing last semicolon', function() {
    var inputString = 'Some text in front<!--@test=1;1;1-->';
    var results = projectSrv.extractTestResult(inputString);

    expect(results[0]).to.be('1');
    expect(results[1]).to.be('1');
    expect(results[2]).to.be('1');
  });


  it('No result string returns empty array', function() {
    var inputString = 'Some text in front';
    var results = projectSrv.extractTestResult(inputString);

    expect(results).to.have.length(0);
  });
});


describe('Test the removal of a result-string from the program output', function() {

  it('Basic removal at the end of the output', function() {
    var inputString = 'Hello World!\n<!--@test=1;1;1;-->';
    var result = projectSrv.removeTestResult(inputString);

    expect(result).to.be('Hello World!\n');
  });


  it('Basic removal at the beginning of the output', function() {
    var inputString = '<!--@test=1;1;1;-->Hello World!\n';
    var result = projectSrv.removeTestResult(inputString);

    expect(result).to.be('Hello World!\n');
  });


  it('Removal at beginning and end', function() {
    var inputString = '<!--@test=1;1;1;-->Hello World!\n<!--@test=1;1;1;-->';
    var result = projectSrv.removeTestResult(inputString);

    expect(result).to.be('Hello World!\n');
  });


  it('Removal handles newline character at end ouf output', function() {
    var inputString = 'Hello World!\n<!--@test=1;1;1;-->\n';
    var result = projectSrv.removeTestResult(inputString);

    expect(result).to.be('Hello World!\n');
  });


  it('Removal leaves newline character at beginning ouf output', function() {
    var inputString = '<!--@test=1;1;1;-->\nHello World!\n';
    var result = projectSrv.removeTestResult(inputString);

    expect(result).to.be('\nHello World!\n');
  });


  it('Removal handles decimal numbers as part of result string', function() {
    var inputString = 'Hello World!\n<!--@test=0.555;1;12;-->\n';
    var result = projectSrv.removeTestResult(inputString);

    expect(result).to.be('Hello World!\n');
  });


  it('Removal handles decimal numbers as part of result string', function() {
    var inputString = '<!--@test=0.555;1;12;-->\nHello World!\n';
    var result = projectSrv.removeTestResult(inputString);

    expect(result).to.be('\nHello World!\n');
  });


  it('Removal makes last semicolon optional', function() {
    var inputString = 'Hello World!\n<!--@test=0.555;1;12-->';
    var result = projectSrv.removeTestResult(inputString);

    expect(result).to.be('Hello World!\n');
  });
});


