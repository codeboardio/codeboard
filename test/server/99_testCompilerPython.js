var app = require('../../server.js'),
  request = require('supertest'),
  express = require('express'),
  should = require('should'),
  bodyParser = require('body-parser'),
  fs = require('fs');

app.use(bodyParser());

var projectUrl = '/api/projects/6';

describe('Test Mantra with Python compilation', function () {

  this.timeout(50000);

  it('Mantra Python: successful compilation (one file)', function (done) {
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/python/py_one_file.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        //console.log(reply.body.output);
        (reply.body.output.indexOf("Goodbye, World!")).should.not.equal(-1);
        reply.body.compilationError.should.equal(false);
        reply.body.id.should.not.equal(undefined);
        done();
      })
  });


  it('Mantra Python: successful compilation (several files)', function (done) {
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/python/py_several_files.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        //console.log(reply.body.id);
        //console.log(reply.body.output);
        (reply.body.output.indexOf("Goodbye, foo!")).should.not.equal(-1);
        (reply.body.output.indexOf("Goodbye, World!")).should.not.equal(-1);
        reply.body.compilationError.should.equal(false);
        reply.body.id.should.not.equal(undefined);
        done();
      });
  });

  it('Mantra Python: successful compilation (several files in folders)', function (done) {
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/python/py_several_files_folder.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        //console.log(reply.body.id);
        //console.log(reply.body.output);
        (reply.body.output.indexOf("Goodbye, P1.foo!")).should.not.equal(-1);
        (reply.body.output.indexOf("Goodbye, P1.bar!")).should.not.equal(-1);
        (reply.body.output.indexOf("Goodbye, World!")).should.not.equal(-1);
        reply.body.id.should.not.equal(undefined);
        done();
      });
  });


  it('Mantra Python: error in setting file', function (done) {
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/python/py_error_setting.json"));
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


  it('Mantra Python: error in setting file (missing setting file)', function (done) {
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/python/py_error_missing_setting.json"));
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


  it('Mantra Python: error in compilation (one file)', function (done) {
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/python/py_error_one_file.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        reply.body.id.should.not.equal(undefined);
        (reply.body.output.indexOf("NameError: name 'foo23' is not defined")).should.not.equal(-1);
        (reply.body.output.indexOf(" File \"./Root/application.py\", line 1, in <module>")).should.not.equal(-1);
        done();
      });
  });


  it('Mantra Python: error in compilation (missing main file)', function (done) {
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/python/py_error_main.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        reply.body.id.should.not.equal(undefined);
        (reply.body.output.indexOf("python: can't open file './Root/application.py': [Errno 2] No such file or directory")).should.not.equal(-1);
        done();
      });
  });


  it('Mantra Python: error in compilation (several files)', function (done) {
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/python/py_error_several_files.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        reply.body.id.should.not.equal(undefined);
        (reply.body.output.indexOf("File \"./Root/application.py\", line 1, in <module>")).should.not.equal(-1);
        (reply.body.output.indexOf("from b import foo")).should.not.equal(-1);
        (reply.body.output.indexOf("ImportError: No module named b")).should.not.equal(-1);
        done();
      });
  });


  it('Mantra Python: successful incremental compilation ', function (done) {
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/python/py_incremental1.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        data = JSON.parse(fs.readFileSync("./test/server/src_examples/python/py_incremental2.json"));
        data.id = reply.body.id;
        reply.body.id.should.not.equal(undefined);
        request(app)
          .post(projectUrl)
          .send(data)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function (error, reply) {
            (reply.body.output.indexOf("Goodbye, foo!")).should.not.equal(-1);
            (reply.body.output.indexOf("Goodbye, World!")).should.not.equal(-1);
            reply.body.compilationError.should.equal(false);
            reply.body.id.should.not.equal(undefined);
            data.id.should.equal(reply.body.id);
            done();
          });
      });
  });


  it('Mantra Python: error in incremental compilation ', function (done) {
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/python/py_error_incremental1.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        data = JSON.parse(fs.readFileSync("./test/server/src_examples/python/py_error_incremental2.json"));
        data.id = reply.body.id;
        request(app)
          .post(projectUrl)
          .send(data)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function (error, reply) {
            reply.body.id.should.not.equal(undefined);
            (reply.body.output.indexOf("File \"./Root/application.py\", line 1, in <module>")).should.not.equal(-1);
            (reply.body.output.indexOf("from b import foo")).should.not.equal(-1);
            (reply.body.output.indexOf("ImportError: No module named b")).should.not.equal(-1);
            data.id.should.equal(reply.body.id);
            done();
          });
      });
  });


  it('Mantra Python: successful incremental compilation with wrong ID', function (done) {
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/python/py_wrong_id1.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        data = JSON.parse(fs.readFileSync("./test/server/src_examples/python/py_wrong_id2.json"));
        data.id = "WRONG_ID";
        request(app)
          .post(projectUrl)
          .send(data)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function (error, reply) {
            (reply.body.output.indexOf("Goodbye, foo!")).should.not.equal(-1);
            (reply.body.output.indexOf("Goodbye, World!")).should.not.equal(-1);
            reply.body.compilationError.should.equal(false);
            reply.body.id.should.not.equal(undefined);
            done();
          });
      });
  });


  // Note that this post takes the files, and it is an special case in Python.
  it('Mantra Python: Special in Python: valid run even with invalid ID', function (done) {
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/python/py_run_invalid_id.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(404)
      .end(function (error, reply) {
        console.log(reply.body);
        reply.statusCode.should.equal(404);
        reply.body.msg.should.equal("Requested resource does not exist.");
        done();
      });
  });
});