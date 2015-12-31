/**
 * Created by hce on March 11, 2015.
 *
 * Test cases for the server's testing service: testingSrv.
 */


var env = process.env.NODE_ENV = 'test';

var testingSrv = require('../../../lib/services/testingSrv.js'),
  expect = require('expect.js');

describe('Payload preparation', function() {

  it('Simple, correct input data', function() {

    var input = [
      {"filename":"Root/src/Finder.java", "content":"Content of Finder"},
      {"filename":"Root/src/Main.java", "content":"Content of Main"},
      {"filename":"Root/test/FinderTest.java", "content":"Content of FinderTest"},
      {"filename":"Root/test_submission/SubTest.java", "content":"Content of SubTest"},
      {"filename":"Root/codeboard.json", "content":"{\n\t\"_comment\": \"Configuration for this Java-JUnit project.\",\n\t\"MainClassForRunning\": \"Main\",\n\t\"ClassPath\": \"/usr/share/java/*\",\n\t\"DirectoryForClassFiles\": \"./Root/bin\",\n\t\"DirectoryForSourceFiles\": \"./Root/src\",\n\t\"DirectoryForTestFiles\": \"./Root/test\",\n\t\"DirectoryForTestSubmissionFiles\": \"./Root/test_submission\"\n}\n"}
    ];

    var expectedOutput = {
      srcFiles: [
        {"filename": "Root/src/Finder.java", "content": "Content of Finder"},
        {"filename": "Root/src/Main.java", "content": "Content of Main"}
      ],
      testFiles: [
        {"filename":"Root/test/FinderTest.java", "content":"Content of FinderTest"}
      ],
      testSubmissionFiles: [
        {"filename": "Root/test_submission/SubTest.java", "content": "Content of SubTest"}
      ],
      otherFiles: [
        {"filename": "Root/codeboard.json", "content": "{\n\t\"_comment\": \"Configuration for this Java-JUnit project.\",\n\t\"MainClassForRunning\": \"Main\",\n\t\"ClassPath\": \"/usr/share/java/*\",\n\t\"DirectoryForClassFiles\": \"./Root/bin\",\n\t\"DirectoryForSourceFiles\": \"./Root/src\",\n\t\"DirectoryForTestFiles\": \"./Root/test\",\n\t\"DirectoryForTestSubmissionFiles\": \"./Root/test_submission\"\n}\n"}
      ]
    };

    var results = testingSrv.getFilesByType(input);
    expect(results).to.eql(expectedOutput);
  });


  it('Missing codeboard.json file, but correct default paths', function() {

    var input = [
      {"filename":"Root/src/Finder.java", "content":"Content of Finder"},
      {"filename":"Root/src/Main.java", "content":"Content of Main"},
      {"filename":"Root/test/FinderTest.java", "content":"Content of FinderTest"},
      {"filename":"Root/test_submission/SubTest.java", "content":"Content of SubTest"}
    ];

    var expectedOutput = {
      srcFiles: [
        {"filename": "Root/src/Finder.java", "content": "Content of Finder"},
        {"filename": "Root/src/Main.java", "content": "Content of Main"}
      ],
      testFiles: [
        {"filename":"Root/test/FinderTest.java", "content":"Content of FinderTest"}
      ],
      testSubmissionFiles: [
        {"filename": "Root/test_submission/SubTest.java", "content": "Content of SubTest"}
      ],
      otherFiles: []
    };

    var results = testingSrv.getFilesByType(input);
    expect(results).to.eql(expectedOutput);
  });


  it('File codeboard.json exists but is missing the paths properties, fallback to default path', function() {

    var input = [
      {"filename":"Root/src/Finder.java", "content":"Content of Finder"},
      {"filename":"Root/src/Main.java", "content":"Content of Main"},
      {"filename":"Root/test/FinderTest.java", "content":"Content of FinderTest"},
      {"filename":"Root/myTest_submission/SubTest.java", "content":"Content of SubTest"},
      {"filename":"Root/codeboard.json", "content":"{\n\t\"_comment\": \"Configuration for this Java-JUnit project.\", \"DirectoryForTestSubmissionFiles\": \"./Root/myTest_submission\"\n}\n"}
    ];

    var expectedOutput = {
      srcFiles: [
        {"filename": "Root/src/Finder.java", "content": "Content of Finder"},
        {"filename": "Root/src/Main.java", "content": "Content of Main"}
      ],
      testFiles: [
        {"filename":"Root/test/FinderTest.java", "content":"Content of FinderTest"}
      ],
      testSubmissionFiles: [
        {"filename": "Root/myTest_submission/SubTest.java", "content": "Content of SubTest"}
      ],
      otherFiles: [
        {"filename":"Root/codeboard.json", "content":"{\n\t\"_comment\": \"Configuration for this Java-JUnit project.\", \"DirectoryForTestSubmissionFiles\": \"./Root/myTest_submission\"\n}\n"}
      ]
    };

    var results = testingSrv.getFilesByType(input);
    expect(results).to.eql(expectedOutput);
  });


  it('Invalid JSON syntax in codeboard.json file, but correct default paths', function() {

    var input = [
      {"filename":"Root/src/Finder.java", "content":"Content of Finder"},
      {"filename":"Root/src/Main.java", "content":"Content of Main"},
      {"filename":"Root/test/FinderTest.java", "content":"Content of FinderTest"},
      {"filename":"Root/test_submission/SubTest.java", "content":"Content of SubTest"},
      {"filename":"Root/codeboard.json", "content":"\n\t\"_comment\": \"Configuration for this Java-JUnit project.\",\n\t\"MainClassForRunning\": \"Main\",\n\t\"ClassPath\": \"/usr/share/java/*\",\n\t\"DirectoryForClassFiles\": \"./Root/bin\",\n\t\"DirectoryForSourceFiles\": \"./Root/src\",\n\t\"DirectoryForTestFiles\": \"./Root/test\",\n\t\"DirectoryForTestSubmissionFiles\": \"./Root/test_submission\"\n}\n"}
    ];

    var expectedOutput = {
      srcFiles: [
        {"filename": "Root/src/Finder.java", "content": "Content of Finder"},
        {"filename": "Root/src/Main.java", "content": "Content of Main"}
      ],
      testFiles: [
        {"filename":"Root/test/FinderTest.java", "content":"Content of FinderTest"}
      ],
      testSubmissionFiles: [
        {"filename": "Root/test_submission/SubTest.java", "content": "Content of SubTest"}
      ],
      otherFiles: [
        {"filename": "Root/codeboard.json", "content": "\n\t\"_comment\": \"Configuration for this Java-JUnit project.\",\n\t\"MainClassForRunning\": \"Main\",\n\t\"ClassPath\": \"/usr/share/java/*\",\n\t\"DirectoryForClassFiles\": \"./Root/bin\",\n\t\"DirectoryForSourceFiles\": \"./Root/src\",\n\t\"DirectoryForTestFiles\": \"./Root/test\",\n\t\"DirectoryForTestSubmissionFiles\": \"./Root/test_submission\"\n}\n"}
      ]
    };

    var results = testingSrv.getFilesByType(input);
    expect(results).to.eql(expectedOutput);
  });


  it('File paths differ from defaults but are correctly defined in codeboard.json', function() {

    var input = [
      {"filename":"Root/mySrc/Finder.java", "content":"Content of Finder"},
      {"filename":"Root/mySrc/Main.java", "content":"Content of Main"},
      {"filename":"Root/myTest/FinderTest.java", "content":"Content of FinderTest"},
      {"filename":"Root/myTest_submission/SubTest.java", "content":"Content of SubTest"},
      {"filename":"Root/codeboard.json", "content":"{\n\t\"_comment\": \"Configuration for this Java-JUnit project.\",\n\t\"MainClassForRunning\": \"Main\",\n\t\"ClassPath\": \"/usr/share/java/*\",\n\t\"DirectoryForClassFiles\": \"./Root/bin\",\n\t\"DirectoryForSourceFiles\": \"./Root/mySrc\",\n\t\"DirectoryForTestFiles\": \"./Root/myTest\",\n\t\"DirectoryForTestSubmissionFiles\": \"./Root/myTest_submission\"\n}\n"}
    ];

    var expectedOutput = {
      srcFiles: [
        {"filename": "Root/mySrc/Finder.java", "content": "Content of Finder"},
        {"filename": "Root/mySrc/Main.java", "content": "Content of Main"}
      ],
      testFiles: [
        {"filename":"Root/myTest/FinderTest.java", "content":"Content of FinderTest"}
      ],
      testSubmissionFiles: [
        {"filename": "Root/myTest_submission/SubTest.java", "content": "Content of SubTest"}
      ],
      otherFiles: [
        {"filename": "Root/codeboard.json", "content": "{\n\t\"_comment\": \"Configuration for this Java-JUnit project.\",\n\t\"MainClassForRunning\": \"Main\",\n\t\"ClassPath\": \"/usr/share/java/*\",\n\t\"DirectoryForClassFiles\": \"./Root/bin\",\n\t\"DirectoryForSourceFiles\": \"./Root/mySrc\",\n\t\"DirectoryForTestFiles\": \"./Root/myTest\",\n\t\"DirectoryForTestSubmissionFiles\": \"./Root/myTest_submission\"\n}\n"}
      ]
    };

    var results = testingSrv.getFilesByType(input);
    expect(results).to.eql(expectedOutput);
  });

});
