var env = process.env.NODE_ENV = process.env.NODE_ENV || 'test';

var app = require('../../server.js'),
  request = require('supertest'),
  express = require('express'),
  should = require('should'),
  bodyParser = require('body-parser'),
 expect = require('chai').expect;

app.use(bodyParser());

var cookie, cookie2;
var req = request(app);
var userSetting;

describe('Test Server: Users', function () {

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

  it('User: all users',function(done){
    //reply.body.output.should.equal('Compilation successful');
    //reply.body.compilationError.should.equal(false);
     //(reply.body.output.indexOf("Undefined symbols for ")).should.not.equal(-1);
     request(app)
       .get('/api/users')
       .expect('Content-Type', /json/ )
       .expect(200)
       .end(function (error, reply){
         //console.log('\n\n\nAll users are:\n\n\n\n');
         //console.log(reply.body);
         //reply.body.output.should.equal('Compilation successful');
         //reply.body.compilationError.should.equal(false);
         //reply.body.id.should.not.equal(undefined);
         done();
     })
   });

  it('Create user: fails due to invalid username', function (done) {
    var data = {};
    data.username = "m";
    data.password = "pe";
    data.email = "martin.eth.com"
    request(app)
      .post('/api/users')
      .send(data)
      .expect('Content-Type', /json/)
      .expect(422)
      .end(function (error, reply) {
        reply.body.msg.should.equal('Invalid username. A username must have between 2 and 30 characters. Invalid password. A password must be at least 4 characters long. Invalid email. Please provide a valid email address.');
        done();
      })
  });
  it('Create user: fails since it already exists', function (done) {
    var data = {};
    data.username = "martin";
    data.password = "pepe";
    data.email = "martin@eth.com"
    request(app)
      .post('/api/users')
      .send(data)
      .expect('Content-Type', /json/)
      .expect(409)
      .end(function (error, reply) {
        reply.body.error.should.equal('UserExists');
        reply.body.msg.should.equal('User martin already exists.');
        done();
      })
  });


  it('Create user: fails since email already exists', function (done) {
    var data = {};
    data.username = "martin6";
    data.password = "pepe1234";
    data.email = "user2@testmail.com"
    request(app)
      .post('/api/users')
      .send(data)
      .expect('Content-Type', /json/)
      .expect(409)
      .end(function (error, reply) {
        console.log(reply.body);
        reply.body.error.should.equal('EmailExists');
        reply.body.msg.should.equal('Email user2@testmail.com is already in use.');
        done();
      })
  });

  // TODO: Fix: using random user name; it might fail
  it('Create user: successful user creation', function (done) {
    var data = {};
    var randomUserName = Math.random().toString(36).substring(12);
    data.username = randomUserName;//"martin123";
    data.password = "pepe1234";
    data.email = randomUserName + "@inf.ethz.ch"
    request(app)
      .post('/api/users')
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        //console.log(reply.body);
        reply.body.username.should.equal(randomUserName);
        //reply.body.msg.should.equal('Email mnordio@inf.ethz.ch is already in use');
        done();
      })
  });

  it('User: access user information', function(done) {
    req
      .get('/api/users/hce')
      .set('cookie', cookie)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(error, reply) {
        if(error) return done(error);
        reply.body.username.should.equal('hce');
        reply.body.url.should.equal('http://codeboard.io/users/hce');
        reply.body.location.should.equal('Switzerland');
        reply.body.institution.should.equal('ETH Zurich');
        reply.body.imageUrl.should.equal('/images/users/defaults/smile6.png');
        done()
      });
  });

  it('User: access own user setting', function(done) {
    req
      .get('/api/users/hce/settings')
      .set('cookie', cookie)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(error, reply) {
        if(error) return done(error);
        reply.body.username.should.equal('hce');
        reply.body.email.should.equal('user1@testmail.com');
        reply.body.url.should.equal('http://codeboard.io/users/hce');
        reply.body.location.should.equal('Switzerland');
        reply.body.institution.should.equal('ETH Zurich');
        reply.body.imageUrl.should.equal('/images/users/defaults/smile6.png');
        done()
      });
  });


  it('User: modify own user setting', function(done) {
    req
      .get('/api/users/martin/settings')
      .set('cookie', cookie2)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(error, reply) {
        if(error) return done(error);
        userSetting = reply.body;
        userSetting.location = "Argentina";
        userSetting.institution = "Codeboard.io";
        userSetting.imageUrl = '/images/users/defaults/smile1.png';
        userSetting.url ='http://se.inf.ethz.ch/people/nordio';
        req
          .put('/api/users/martin/settings')
          .set('cookie', cookie2)
          .send(userSetting)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(error, reply) {
            if(error) return done(error);
            //console.log(reply.body);
            reply.body.username.should.equal('martin');
            reply.body.url.should.equal('http://se.inf.ethz.ch/people/nordio');
            reply.body.location.should.equal('Argentina');
            reply.body.institution.should.equal('Codeboard.io');
            reply.body.imageUrl.should.equal('/images/users/defaults/smile1.png');
            done()
          });
    });
  });

  it('User: fail to access profile without signing in', function(done) {
    req
      .get('/api/users/hce/settings')
      .expect(401)
      .end(function(error, reply) {
        if(error) return done(error);
        done()
      });
  });

  it('User: fail to access profile of other user', function(done) {
    req
      .get('/api/users/hce/settings')
      .set('cookie', cookie2)
      .expect(401)
      .end(function(error, reply) {
        if(error) return done(error);
        done()
      });
  });

  it('User: fail to sign in with wrong password', function(done) {
    req
      .post('/api/session')
      .send({username: 'hce', password: 'Wrong1234'})
      .expect('Content-Type', /json/ )
      .expect(200)
      .end(function(error, reply) {
        reply.body.message.should.equal('Wrong username or password.');
        //console.log(reply);
        done();
      });
  });

  it('User: fail to sign in with payload', function(done) {
    req
      .post('/api/session')
      .send({usernaWrong: 'hce', passw: 'Wrong1234'})
      .expect('Content-Type', /json/ )
      .expect(200)
      .end(function(error, reply) {
        //reply.body.message.should.equal('Wrong username or password.');
        //console.log(reply);
        done();
      });
  });

  it('User: access all projects of a user', function(done) {
    req
      .get('/api/users/hce/projects')
      .set('cookie', cookie)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(error, reply) {
        if(error) return done(error);
        //console.log(reply.body);
        expect(reply.body.ownerSet).to.have.length.above(8);
        done()
      });
  });

  it('User: access all projects of a user without signing in', function(done) {
    req
      .get('/api/users/hce/projects')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(error, reply) {
        if(error) return done(error);
        //console.log(reply.body);
        expect(reply.body.ownerSet).to.have.length.above(6);
        done()
      });
  });

  /*
  TODO: Write test for file upload
  it('User: upload picture', function(done) {
    var payload = {

    };

    req
      .post('/api/users/hce/settings/userImage')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(error, reply) {
        if(error) return done(error);
        //console.log(reply.body);
        expect(reply.body.ownerSet).to.have.length.above(6);
        done()
      });
  });
  */
});