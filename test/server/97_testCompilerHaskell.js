var app = require('../../server.js'),
  request = require('supertest'),
  express = require('express'),
  should = require('should'),
  bodyParser = require('body-parser'),
  fs = require('fs');

app.use(bodyParser());

var projectUrl = '/api/projects/8';

describe('Test Mantra with Haskell compilation', function () {

  this.timeout(50000);

  it('Mantra Haskell: successful compilation (one file)', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/haskell/hs_one_file.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        //console.log(reply.body.output);
        var compiles = (reply.body.output.indexOf("Compilation successful") != -1) || (reply.body.output.indexOf("Linking output.out ...") != -1)
        compiles.should.equal(true);
        reply.body.compilationError.should.equal(false);
        reply.body.id.should.not.equal(undefined);
        done();
      })

  });


  it('Mantra Haskell: successful compilation (several files)', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/haskell/hs_several_files.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        //console.log(reply.body.id);
        var compiles = (reply.body.output.indexOf("Compilation successful") != -1) || (reply.body.output.indexOf("Linking output.out ...") != -1)
        compiles.should.equal(true);
        reply.body.compilationError.should.equal(false);
        reply.body.id.should.not.equal(undefined);
        done();
      });
  });


  it('Mantra Haskell: successful compilation (several files in folders)', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/haskell/hs_several_files_folders.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        //console.log(reply.body.output);
        var compiles = (reply.body.output.indexOf("Compilation successful") != -1) || (reply.body.output.indexOf("Linking output.out ...") != -1)
        compiles.should.equal(true);
        reply.body.compilationError.should.equal(false);
        reply.body.id.should.not.equal(undefined);
        done();
      });
  });


  it('Mantra Haskell: error in setting file', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/haskell/hs_error_setting_file.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        reply.statusCode.should.equal(400);
        (reply.body.output.indexOf("The provided Codeboard configuration (codeboard.json) violates the JSON format.")).should.not.equal(-1);
        done();
      });
  });


  it('Mantra Haskell: error in setting file (missing setting file)', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/haskell/hs_error_missing_setting.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        reply.statusCode.should.equal(400);
        (reply.body.output.indexOf("The provided files are missing the Codeboard configuration file (codeboard.json).")).should.not.equal(-1);
        done();
      });
  });


  it('Mantra Haskell: error in compilation (one file)', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/haskell/hs_error_one_file.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        //console.log(reply.body.output);
        var compiles = (reply.body.output.indexOf("Compilation successful") != -1) || (reply.body.output.indexOf("Linking output.out ...") != -1)
        compiles.should.equal(false);
        reply.body.compilationError.should.equal(true);
        reply.body.id.should.not.equal(undefined);
        (reply.body.output.indexOf("application.hs:2:3: Not in scope:")).should.not.equal(-1);
        done();
      });
  });


  it('Mantra Haskell: error in compilation (missing main file)', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/haskell/hs_error_main.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        var compiles = (reply.body.output.indexOf("Compilation successful") != -1) || (reply.body.output.indexOf("Linking output.out ...") != -1)
        compiles.should.equal(false);
        reply.body.compilationError.should.equal(true);
        reply.body.id.should.not.equal(undefined);
        done();
      });
  });


  it('Mantra Haskell: error in compilation (several files)', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/haskell/hs_error_several_files.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        //console.log(reply.body.output);
        var compiles = (reply.body.output.indexOf("Compilation successful") != -1) || (reply.body.output.indexOf("Linking output.out ...") != -1)
        compiles.should.equal(false);
        reply.body.compilationError.should.equal(true);
        reply.body.id.should.not.equal(undefined);
        //(reply.body.output.indexOf("application.hs:1:8:")).should.not.equal(-1);
        (reply.body.output.indexOf("Could not find module")).should.not.equal(-1);
        done();
      });
  });


  it('Mantra Haskell: successful incremental compilation ', function (done) {
    
    var data = {};

    data = JSON.parse(fs.readFileSync("./test/server/src_examples/haskell/hs_incremental1.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        data = JSON.parse(fs.readFileSync("./test/server/src_examples/haskell/hs_incremental2.json"));
        data.id = reply.body.id;
        reply.body.compilationError.should.equal(true);
        reply.body.id.should.not.equal(undefined);
        request(app)
          .post(projectUrl)
          .send(data)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function (error, reply) {
            var compiles = (reply.body.output.indexOf("Compilation successful") != -1) || (reply.body.output.indexOf("Linking output.out ...") != -1)
            compiles.should.equal(true);
            reply.body.compilationError.should.equal(false);
            reply.body.id.should.not.equal(undefined);
            data.id.should.equal(reply.body.id);
            done();
          });
      });
  });


  it('Mantra Haskell: error in incremental compilation ', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/haskell/hs_error_incremental1.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        data = JSON.parse(fs.readFileSync("./test/server/src_examples/haskell/hs_error_incremental1.json"));
        data.id = reply.body.id;
        request(app)
          .post(projectUrl)
          .send(data)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function (error, reply) {
            //console.log(reply.body.output);
            var compiles = (reply.body.output.indexOf("Compilation successful") != -1) || (reply.body.output.indexOf("Linking output.out ...") != -1)
            compiles.should.equal(false);
            reply.body.compilationError.should.equal(true);
            reply.body.id.should.not.equal(undefined);
            (reply.body.output.indexOf("application.hs:1:8:")).should.not.equal(-1);
            (reply.body.output.indexOf("Could not find module ")).should.not.equal(-1);
            done();
          });
      });
  });

  it('Mantra Haskell: successful incremental compilation with wrong ID', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/haskell/hs_wrong_id1.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        reply.body.compilationError.should.equal(true);
        reply.body.id.should.not.equal(undefined);
        data = JSON.parse(fs.readFileSync("./test/server/src_examples/haskell/hs_wrong_id2.json"));
        data.id = "WRONG_ID";
        request(app)
          .post(projectUrl)
          .send(data)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function (error, reply) {
            var compiles = (reply.body.output.indexOf("Compilation successful") != -1) || (reply.body.output.indexOf("Linking output.out ...") != -1)
            compiles.should.equal(true);
            reply.body.compilationError.should.equal(false);
            reply.body.id.should.not.equal(undefined);
            done();
          });
      });
  });

  it('Mantra Haskell: successful run (one file)', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/haskell/hs_run_file.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        var compiles = (reply.body.output.indexOf("Compilation successful") != -1) || (reply.body.output.indexOf("Linking output.out ...") != -1)
        compiles.should.equal(true);
        reply.body.compilationError.should.equal(false);
        reply.body.id.should.not.equal(undefined);
        var data2 = {
          language: 'Haskell',
          action: 'run',
          id: reply.body.id,
          stream: false
        };
        request(app)
          .post(projectUrl)
          .send(data2)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function (error, reply) {
            reply.body.output.should.not.equal(undefined);
            (reply.body.output.indexOf("Hello Haskell World!")).should.not.equal(-1);
            done();
          });
      });
  });

  it('Mantra Haskell: successful run (several files)', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/haskell/hs_run_several_files.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        var compiles = (reply.body.output.indexOf("Compilation successful") != -1) || (reply.body.output.indexOf("Linking output.out ...") != -1)
        compiles.should.equal(true);
        reply.body.compilationError.should.equal(false);
        reply.body.id.should.not.equal(undefined);
        var data2 = {
          language: 'Haskell',
          action: 'run',
          id: reply.body.id,
          stream: false
        };
        request(app)
          .post(projectUrl)
          .send(data2)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function (error, reply) {
            //console.log(reply.body.output);
            reply.body.output.should.not.equal(undefined);
            (reply.body.output.indexOf("Hello Haskell World!")).should.not.equal(-1);
            (reply.body.output.indexOf("Hello B")).should.not.equal(-1);
            (reply.body.output.indexOf("Hello C")).should.not.equal(-1);
            done();
          });
      });
  });

  it('Mantra Haskell: successful run (several files in folders)', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/haskell/hs_run_several_files_folder.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        //console.log(reply.body.output);
        var compiles = (reply.body.output.indexOf("Compilation successful") != -1) || (reply.body.output.indexOf("Linking output.out ...") != -1)
        compiles.should.equal(true);
        reply.body.compilationError.should.equal(false);
        reply.body.id.should.not.equal(undefined);
        var data2 = {
          language: 'Haskell',
          action: 'run',
          id: reply.body.id,
          stream: false
        };
        request(app)
          .post(projectUrl)
          .send(data2)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function (error, reply) {
            //console.log(reply.body.output);
            reply.body.output.should.not.equal(undefined);
            (reply.body.output.indexOf("Hello Haskell World!")).should.not.equal(-1);
            (reply.body.output.indexOf("Hello P1.B")).should.not.equal(-1);
            (reply.body.output.indexOf("Hello P1.C")).should.not.equal(-1);
            done();
          });
      });
  });

  it('Mantra Haskell: invalid run due to invalid ID', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/haskell/hs_run_invalid_id.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(404)
      .end(function (error, reply) {
        reply.statusCode.should.equal(404);
        reply.body.msg.should.not.equal(undefined);
        (reply.body.msg.indexOf("The id INVALID_ID is not valid. Try compiling your project and then execute this request again.")).should.not.equal(-1);
        done();
      });
  });
});