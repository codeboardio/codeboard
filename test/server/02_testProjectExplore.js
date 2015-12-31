var env = process.env.NODE_ENV = process.env.NODE_ENV || 'test';

var app = require('../../server.js'),
  request = require('supertest'),
  express = require('express'),
  should = require('should'),
  bodyParser = require('body-parser'),
  expect = require('chai').expect;

app.use(bodyParser());

var cookie,cookie2;
var req = request(app);
var eiffelId, cId, javaId, haskellId;
var eiffelProjectSettings;

describe('Test Server: Projects', function() {

  before(function(done) {
    req
      .post('/api/session')
      .send({username: 'hce', password: '1234'})
      .expect('Content-Type', /json/ )
      .expect(200)
      .end(function(error, reply) {
        //console.log(reply);
        cookie = reply.headers['set-cookie'].pop().split(';')[0]; //.headers['set-cookie'];
        req
          .post('/api/session')
          .send({username: 'martin', password: '1234'})
          .expect('Content-Type', /json/ )
          .expect(200)
          .end(function(error, reply) {
            //console.log(reply);
            cookie2 = reply.headers['set-cookie'].pop().split(';')[0]; //.headers['set-cookie'];
            done();
          });
      });
  });

  it('Projects: get all projects', function(done) {
    req
      .get('/api/projects')
      .set('cookie', cookie2)
      .expect(200)
      .end(function(error, reply) {
        if(error) return done(error);
        expect(reply.body.count).to.be.above(11);
        expect(reply.body.projects).to.have.length.above(7);
        done()
      });
  });

  it('Projects: get all projects for non-signed in user', function(done) {
    req
      .get('/api/projects')
      .expect(200)
      .end(function(error, reply) {
        if(error) return done(error);
        expect(reply.body.count).to.be.above(11);
        expect(reply.body.projects).to.have.length.above(7);
        done()
      });
  });

  it('Projects: get all Eiffel projects', function(done) {
    req
      .get('/api/projects?search=Eiffel')
      .set('cookie', cookie2)
      .expect(200)
      .end(function(error, reply) {
        if(error) return done(error);
        //console.log(reply.body);
        expect(reply.body.count).to.be.above(1);
        expect(reply.body.projects).to.have.length.above(1);
        done()
      });
  });

  it('Projects: get all Java projects', function(done) {
    //var search = 'Java';
    req
      .get('/api/projects?search=Java')
      .set('cookie', cookie2)
      .expect(200)
      .end(function(error, reply) {
        if(error) return done(error);
        //console.log(reply.body);
        expect(reply.body.count).to.be.above(1);
        expect(reply.body.projects).to.have.length.above(1);
        done()
      });
  });

  it('Projects: get all - no project with these keywords', function(done) {
    req
      .get('/api/projects?search=Eiffel pepe Hans')
      .set('cookie', cookie2)
      .expect(422)
      .end(function(error, reply) {
        if(error) return done(error);
        //console.log(reply.body);
        reply.body.msg.should.equal('There are no public projects that match all provided search terms.');
        done()
      });
  });

  it('Projects: get featured projects', function(done) {
    req
      .get('/api/projects/featured')
      .set('cookie', cookie2)
      .expect(200)
      .end(function(error, reply) {
        if(error) return done(error);
        //console.log(reply.body);
        //expect(reply.body.count).to.be.above(12);
        //expect(reply.body.projects).to.have.length.above(7);
        done()
      });
  });

  it('Projects: get featured projects for non-signed in user', function(done) {
    req
      .get('/api/projects/featured')
      .expect(200)
      .end(function(error, reply) {
        if(error) return done(error);
        //expect(reply.body.count).to.be.above(12);
        //expect(reply.body.projects).to.have.length.above(7);
        done()
      });
  });


});
