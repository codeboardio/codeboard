var app = require('../../server.js'),
  request = require('supertest'),
  express = require('express'),
  should = require('should'),
  bodyParser = require('body-parser'),
  fs = require('fs');

app.use(bodyParser());

var projectUrl = '/api/projects/5';

app.use(bodyParser());

describe('Test Mantra with C++ compilation', function () {

  this.timeout(50000);

  it('Mantra C++: successful compilation (one file)', function (done) {

    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/cpp/cpp_one_file.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        reply.body.output.should.equal('Compilation successful\r\n');
        reply.body.compilationError.should.equal(false);
        reply.body.id.should.not.equal(undefined);
        done();
      })
  });

  it('Mantra C++: successful compilation (several files)', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/cpp/cpp_several_files.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        //console.log(reply.body.id);
        reply.body.output.should.equal('Compilation successful\r\n');
        reply.body.compilationError.should.equal(false);
        reply.body.id.should.not.equal(undefined);
        done();
      });
  });

  it('Mantra C++: successful compilation (several files in folders)', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/cpp/cpp_several_files_folders.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        //console.log(reply.body.id);
        reply.body.output.should.equal('Compilation successful\r\n');
        reply.body.compilationError.should.equal(false);
        reply.body.id.should.not.equal(undefined);
        done();
      });
  });

  it('Mantra C++: error in compilation (one file)', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/cpp/cpp_error_one_file.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        //console.log(reply.body.output);
        reply.body.output.should.not.equal('Compilation successful\r\n');
        reply.body.compilationError.should.equal(true);
        reply.body.id.should.not.equal(undefined);

        var compiles = (reply.body.output.indexOf("error: 'foo' was not declared in this scope") != -1) ||
          (reply.body.output.indexOf("error: use of undeclared identifier 'foo'") != -1);
        compiles.should.equal(true);
        done();
      });
  });

  it('Mantra C++: error in compilation (missing main file)', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/cpp/cpp_error_main.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        //console.log(reply.body.output);
        reply.body.output.should.not.equal('Compilation successful\r\n');
        reply.body.compilationError.should.equal(true);
        reply.body.id.should.not.equal(undefined);

        var compiles = (reply.body.output.indexOf("undefined reference to `main'") != -1) ||
          (reply.body.output.indexOf("Undefined symbols for") != -1);
        compiles.should.equal(true);
        done();
      });
  });

  it('Mantra C++: successful incremental compilation ', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/cpp/cpp_incremental1.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        data = JSON.parse(fs.readFileSync("./test/server/src_examples/cpp/cpp_incremental2.json"));
        data.id = reply.body.id;
        reply.body.compilationError.should.equal(true);
        reply.body.id.should.not.equal(undefined);
        request(app)
          .post(projectUrl)
          .send(data)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function (error, reply) {
            reply.body.output.should.equal('Compilation successful\r\n');
            reply.body.compilationError.should.equal(false);
            reply.body.id.should.not.equal(undefined);
            data.id.should.equal(reply.body.id);
            done();
          });
      });
  });

  it('Mantra C++: error in incremental compilation ', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/cpp/cpp_error_incremental1.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        data = JSON.parse(fs.readFileSync("./test/server/src_examples/cpp/cpp_error_incremental2.json"));
        data.id = reply.body.id;
        request(app)
          .post(projectUrl)
          .send(data)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function (error, reply) {
            reply.body.output.should.not.equal('Compilation successful\r\n');
            reply.body.compilationError.should.equal(true);
            reply.body.id.should.not.equal(undefined);
            data.id.should.equal(reply.body.id);
            done();
          });
      });
  });

  it('Mantra C++: successful incremental compilation with wrong ID', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/cpp/cpp_wrong_id1.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        reply.body.id.should.not.equal(undefined);
        data = JSON.parse(fs.readFileSync("./test/server/src_examples/cpp/cpp_wrong_id2.json"));
        data.id = "WRONG_ID";
        request(app)
          .post(projectUrl)
          .send(data)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function (error, reply) {
            //console.log(reply.body.output);
            reply.body.output.should.equal('Compilation successful\r\n');
            reply.body.compilationError.should.equal(false);
            reply.body.id.should.not.equal(undefined);
            done();
          });
      });
  });

  it('Mantra C++: successful run (one file)', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/cpp/cpp_run_file.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        reply.body.output.should.equal('Compilation successful\r\n');
        reply.body.compilationError.should.equal(false);
        reply.body.id.should.not.equal(undefined);
        var data2 = {
          language: 'C++',
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
            (reply.body.output.indexOf("Hello C++ world!")).should.not.equal(-1);
            done();
          });
      });
  });


  it('Mantra C++: successful run (several files in folders)', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/cpp/cpp_run_several_files.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        reply.body.output.should.equal('Compilation successful\r\n');
        reply.body.compilationError.should.equal(false);
        reply.body.id.should.not.equal(undefined);
        var data2 = {
          language: 'C++',
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
            console.log(reply.body.output);
            reply.body.output.should.not.equal(undefined);
            (reply.body.output.indexOf("Hello C++ world!\r\nHello C\r\n")).should.not.equal(-1);
            done();
          });
      });
  });
});