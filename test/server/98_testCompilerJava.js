var app = require('../../server.js'),
  request = require('supertest'),
  express = require('express'),
  should = require('should'),
  bodyParser = require('body-parser'),
  fs = require('fs');

app.use(bodyParser());

var projectUrl = '/api/projects/7';

describe('Test Mantra with Java compilation', function () {

  this.timeout(50000);

  it('Mantra Java: successful compilation (one file)', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/java/j_one_file.json"));
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


  it('Mantra Java: successful compilation (several files)', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/java/j_several_files.json"));
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
      });
  });


  it('Mantra Java: successful compilation (several files in folders)', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/java/j_several_files_folders.json"));
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
      });
  });


  it('Mantra Java: error in compilation (one file)', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/java/j_error.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        reply.body.output.should.not.equal('Compilation successful\r\n');
        reply.body.compilationError.should.equal(true);
        reply.body.id.should.not.equal(undefined);
        (reply.body.output.indexOf("1 error")).should.not.equal(-1);
        (reply.body.output.indexOf("variable b")).should.not.equal(-1);
        done();
      });
  });


  it('Mantra Java: error in setting file', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/java/j_error_setting_file.json"));
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


  it('Mantra Java: error in setting file (missing setting file)', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/java/j_error_missing_setting.json"));
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


  it('Mantra Java: compilation works without main file specified', function (done) {

    // it used to be necessary that the codeboard.json specifies the main file for compilation
    // but since we changed Mantra, we always compile all Java files and the specification is
    // no longer needed

    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/java/j_no_main_specified.json"));
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
      });
  });


  it('Mantra Java: error in compilation (several files)', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/java/j_error_several_files.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        reply.body.output.should.not.equal('Compilation successful\r\n');
        reply.body.compilationError.should.equal(true);
        reply.body.id.should.not.equal(undefined);
        (reply.body.output.indexOf("2 errors")).should.not.equal(-1);
        done();
      });
  });


  it('Mantra Java: successful incremental compilation ', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/java/j_incremental1.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        data = JSON.parse(fs.readFileSync("./test/server/src_examples/java/j_incremental2.json"));
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


  it('Mantra Java: successful incremental compilation with wrong ID', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/java/j_wrong_id1.json"));
    request(app)
      .post(projectUrl)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        reply.body.compilationError.should.equal(true);
        reply.body.id.should.not.equal(undefined);
        data = JSON.parse(fs.readFileSync("./test/server/src_examples/java/j_wrong_id2.json"));
        data.id = "WRONG_ID";
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
          });
      });
  });

  it('Mantra Java: successful run (one file)', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/java/j_run_file.json"));
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
          language: 'Java',
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
            (reply.body.output.indexOf("Hello Java Test-1")).should.not.equal(-1);
            done();
          });
      });
  });


  it('Mantra Java: successful run (several files)', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/java/j_run_several_files.json"));
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
          language: 'Java',
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
            (reply.body.output.indexOf("Hello C")).should.not.equal(-1);
            (reply.body.output.indexOf("Hello B")).should.not.equal(-1);
            (reply.body.output.indexOf("Hello Java Test-2")).should.not.equal(-1);
            done();
          });
      });
  });

  it('Mantra Java: successful run (several files in folders)', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/java/j_run_several_files_folder.json"));
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
          language: 'Java',
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
            (reply.body.output.indexOf("Hello C\r\nHello B\r\nHello")).should.not.equal(-1);
            (reply.body.output.indexOf("Hello D\r\nHello E\r\nHello")).should.not.equal(-1);
            (reply.body.output.indexOf("Hello Java Test-3")).should.not.equal(-1);
            done();
          });
      });
  });


  it('Mantra Java: invalid run due to invalid ID', function (done) {
    
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/java/j_run_invalid_id.json"));
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
