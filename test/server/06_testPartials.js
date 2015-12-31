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

describe('Test Server: Partials', function() {
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

  it('Main: main page', function(done) {
    req
      .get('/')
      .set('cookie', cookie)
      //.expect('Content-Type', /json/)
      //.expect(201)
      .end(function(error, reply) {
        if(error) return done(error);
        console.log(reply.body);
        done()
      });
  });

  // TODO: working here
  it('Partials: main page', function(done) {
    req
      .get('/partials/main')
      .set('cookie', cookie)
      //.expect('Content-Type', /json/)
      //.expect(201)
      .end(function(error, reply) {
        if(error) return done(error);
        console.log(reply.body);
        done()
      });
  });




});
