var env = process.env.NODE_ENV = process.env.NODE_ENV || 'test';

var app = require('../../server.js'),
  request = require('supertest'),
  express = require('express'),
  should = require('should'),
  bodyParser = require('body-parser'),
  expect = require('chai').expect,
  fs = require('fs');

app.use(bodyParser());

var cookie, cookie2;
var req = request(app);
var ltiProjectId

/*
 function extractLtiProjectId(ownerSet) {
 console.log('EXTRACTING LTI project');
 for (index = 0; index < ownerSet.length; ++index) {
 var item = ownerSet[index];
 console.log('Found project '+item.id);
 if (item.id==18) {
 console.log(item);
 }
 if (item.isLtiAllowed==true) {
 ltiProjectId = item.id;
 console.log('Found LTI project');
 }
 }
 }*/

describe('Test Server: LTI and Submissions', function () {
  before(function (done) {
    req
      .post('/api/session')
      .send({username: 'hce', password: '1234'})
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (error, reply) {
        //console.log(reply);
        cookie = reply.headers['set-cookie'].pop().split(';')[0]; //.headers['set-cookie'];
        req
          .post('/api/session')
          .send({username: 'martin', password: '1234'})
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function (error, reply) {
            //console.log(reply);
            cookie2 = reply.headers['set-cookie'].pop().split(';')[0]; //.headers['set-cookie'];
            // get all projects of Martin
            /*req
             .get('/api/users/martin/projects')
             .set('cookie', cookie2)
             .expect('Content-Type', /json/)
             .expect(200)
             .end(function(error, reply) {
             if(error) return done(error);
             //console.log(reply.body);
             extractLtiProjectId(reply.body.ownerSet);
             done()
             });*/
            done();
          });
      });
  });

  // This test fails due to wrong oauth.
  // TODO: write a new test with a correct oauth (it might be tricky).
  it('LTI: LTI access fails due to wrong oauth', function (done) {
    var payload = {
      launch_presentation_return_url: "",
      lti_version: "LTI-1p0",
      user_id: "f65ea4e084f17366c7178a8ce4a2b010",
      roles: "Instructor",
      oauth_nonce:"78614488450333425431416928633",
      oauth_timestamp:"1416928633",
      lis_result_sourcedid: "ETHx%2FCAMSx%2F3T2014%3Acourses.edx.org-i4x-ETHx-CAMSx-lti-b182fb23f8c14bda920ec8dcbdca7082%3Af65ea4e084f17366c7178a8ce4a2b010",
      context_id: "ETHx%2FCAMSx%2F3T2014",
      oauth_consumer_key: "edxcams",
      resource_link_id: "courses.edx.org-i4x-ETHx-CAMSx-lti-b182fb23f8c14bda920ec8dcbdca7082",
      oauth_signature_method: "HMAC-SHA1",
      oauth_version: "1.0",
      lis_outcome_service_url: "https%3A%2F%2Fcourses.edx.org%2Fcourses%2FETHx%2FCAMSx%2F3T2014%2Fxblock%2Fi4x%3A%3B_%3B_ETHx%3B_CAMSx%3B_lti%3B_b182fb23f8c14bda920ec8dcbdca7082%2Fhandler_noauth%2Fgrade_handler",
      oauth_signature: "X0%2BmcTC7WHgXK5DELgFt9hXfIyY%3D",
      lti_message_type: "basic-lti-launch-request",
      oauth_callback: "about%3Ablank"
    };
    req
      .post('/lti/projects/18')
      .set('cookie', cookie)
      .send(payload)
      .expect('Content-Type', /json/)
      //.expect(201)
      .end(function (error, reply) {
        console.log(reply.body);
        if (error) return done(error);
        reply.body.msg.should.equal('You are not authorized to access this page. Please check that this project allows for LTI access and that key/secret are correct.');
        done()
      });
  });

  it('Projects: get settings of after logout fails', function (done) {
    console.log('/api/projects/6898');
    req
      .get('/api/projects/6898')
      .set('cookie', cookie)
      .expect(404)
      .end(function (error, reply) {
        if (error) return done(error);
        done()
      });
  });


  it('LTI: submissions to a public project', function (done) {
    console.log('submission public project 19');
    var data = {};
    data = JSON.parse(fs.readFileSync("./test/server/src_examples/java/j_one_file.json"));
  req
    .post('/api/projects/19/submissions')
    .set('cookie', cookie)
    .send(data)
    .expect('Content-Type', /json/)
    .expect(200)
    .end(function (error, reply) {
      console.log(reply.body);
      if (error) return done(error);
      reply.body.msg.should.equal('Submission successful.');
      done()
    });
});

it('Submissions: submit fails due to non existing project', function (done) {
  console.log('/api/projects/6898/submissions');
  req
    .get('/api/projects/6898/submissions')
    .set('cookie', cookie)
    .expect(404)
    .end(function (error, reply) {
      if (error) return done(error);
      done()
    });
});
})
;
