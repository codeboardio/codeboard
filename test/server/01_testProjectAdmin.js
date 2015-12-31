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

  this.timeout(5000);

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

  it('Projects: create an Eiffel project', function(done) {
    var data = {
      projectname: "aTestProjectEiffel",
      description: "A project in Eiffel for testing",
      language: "Eiffel",
      isPrivate: false
    };
    req
      .post('/api/projects')
      .set('cookie', cookie)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(201)
      .end(function(error, reply) {
        if(error) return done(error);
        reply.body.message.should.equal('Successfully created project.');
        eiffelId = reply.body.id;
        done()
      });
  });

  it('Projects: create a private Eiffel project', function(done) {
    var data = {
      projectname: "aTestProjectEiffelPrivate",
      description: "A private project in Eiffel for testing",
      language: "Eiffel",
      isPrivate: true
    };
    req
      .post('/api/projects')
      .set('cookie', cookie)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(201)
      .end(function(error, reply) {
        if(error) return done(error);
        reply.body.message.should.equal('Successfully created project.');
        done()
      });
  });

  it('Projects: create a C project', function(done) {
    var data = {
      projectname: "aTestProjectC",
      description: "A project in C for testing",
      language: "C",
      isPrivate: false
    };
    req
      .post('/api/projects')
      .set('cookie', cookie)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(201)
      .end(function(error, reply) {
        if(error) return done(error);
        reply.body.message.should.equal('Successfully created project.');
        cId = reply.body.id;
        done()
      });
  });

  it('Projects: create a Cpp project', function(done) {
    var data = {
      projectname: "aTestProjectCpp",
      description: "A project in C++ for testing",
      language: "C++",
      isPrivate: false
    };
    req
      .post('/api/projects')
      .set('cookie', cookie)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(201)
      .end(function(error, reply) {
        if(error) return done(error);
        reply.body.message.should.equal('Successfully created project.');
        done()
      });
  });

  it('Projects: create a Haskell project', function(done) {
    var data = {
      projectname: "aTestProjectHaskell",
      description: "A project in Haskell for testing",
      language: "Haskell",
      isPrivate: false
    };
    req
      .post('/api/projects')
      .set('cookie', cookie)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(201)
      .end(function(error, reply) {
        if(error) return done(error);
        reply.body.message.should.equal('Successfully created project.');
        haskellId = reply.body.id;
        done()
      });
  });

  it('Projects: create a Java project', function(done) {
    var data = {
      projectname: "aTestProjectJava",
      description: "A project in Java for testing",
      language: "Java",
      isPrivate: false
    };
    req
      .post('/api/projects')
      .set('cookie', cookie)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(201)
      .end(function(error, reply) {
        if(error) return done(error);
        reply.body.message.should.equal('Successfully created project.');
        javaId = reply.body.id;
        done()
      });
  });

  it('Projects: create a private Java project', function(done) {
    var data = {
      projectname: "aTestProjectPrivateJava",
      description: "A project in Java for testing",
      language: "Java",
      isPrivate: true
    };
    req
      .post('/api/projects')
      .set('cookie', cookie)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(201)
      .end(function(error, reply) {
        if(error) return done(error);
        reply.body.message.should.equal('Successfully created project.');
        done()
      });
  });

  it('Projects: create a Python project', function(done) {
    var data = {
      projectname: "aTestProjectPython",
      description: "A project in Python for testing",
      language: "Python",
      isPrivate: false
    };
    req
      .post('/api/projects')
      .set('cookie', cookie)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(201)
      .end(function(error, reply) {
        if(error) return done(error);
        reply.body.message.should.equal('Successfully created project.');
        done()
      });
  });

  it('Projects: delete a project', function(done) {
    var data = {
      projectname: "aDeleteTestProjectEiffel",
      description: "A project in Eiffel for testing",
      language: "Eiffel",
      isPrivate: false
    };
    req
      .post('/api/projects')
      .set('cookie', cookie)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(201)
      .end(function(error, reply) {
        if(error) return done(error);
        reply.body.message.should.equal('Successfully created project.');
        var id = reply.body.id;
        // delete the project
        req
          .del('/api/projects/'+id)
          .set('cookie', cookie)
          .send(data)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(error, reply) {
            if(error) return done(error);
            //console.log(reply.body);
            reply.body.msg.should.equal('Project deletion successful.');
            done()
          });
      });
  });

  it('Projects: get settings of an Eiffel project', function(done) {
    console.log('/api/projects/'+eiffelId+'/settings');
    req
      .get('/api/projects/'+eiffelId+'/settings')
      .set('cookie', cookie)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(error, reply) {
        if(error) return done(error);
        eiffelProjectSettings = reply.body; //.message.should.equal('Successfully created project.');
        reply.body.projectname.should.equal('aTestProjectEiffel');
        reply.body.description.should.equal('A project in Eiffel for testing');
        reply.body.language.should.equal('Eiffel');
        reply.body.ownerSet.length.should.equal(1);
        reply.body.userSet.length.should.equal(0);
        done()
      });
  });

  it('Projects: modify settings of an Eiffel project', function(done) {
    console.log('/api/projects/'+eiffelId+'/settings');
    var dataProject = {};
    dataProject.projectname = "aModifiedEiffel";
    dataProject.description = "a new description";
    dataProject.language = "Eiffel";
    dataProject.ownerSet = [];
    dataProject.userSet = [];
    dataProject.code = eiffelProjectSettings.code;
    dataProject.isPrivate = eiffelProjectSettings.isPrivate;
    dataProject.isSubmissionAllowed = eiffelProjectSettings.isSubmissionAllowed;
    dataProject.isLtiAllowed = true;
    dataProject.ltiKey = eiffelProjectSettings.ltiKey;
    dataProject.ltiSecret = eiffelProjectSettings.ltiSecret;
    dataProject.id = eiffelProjectSettings.id;

    // we iterate over ownerSet and userSet to make sure we only submit the usernames and no other data
    for(var index in eiffelProjectSettings.ownerSet) {
      dataProject.ownerSet.push(eiffelProjectSettings.ownerSet[index].username);
    }
    for(var index in eiffelProjectSettings.userSet) {
      dataProject.userSet.push(eiffelProjectSettings.userSet[index].username);
    }

    req
      .put('/api/projects/'+eiffelId+'/settings')
      .set('cookie', cookie)
      .send(dataProject)
      //.expect('Content-Type', /json/)
      .expect(200)
      .end(function(error, reply) {
        if(error) return done(error);
        //console.log(reply.body);
        reply.body.message.should.equal('Project data saved.');
        done()
      });
  });

  it('Projects: create project for martin; add user hce (modify settings of a private Eiffel project)', function(done) {
    var data = {
      projectname: "aTestPrivateProjectMartin",
      description: "A project in Eiffel for testing",
      language: "Eiffel",
      isPrivate: true
    };
    req
      .post('/api/projects')
      .set('cookie', cookie2)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(201)
      .end(function(error, reply) {
        if(error) return done(error);
        reply.body.message.should.equal('Successfully created project.');
        var id = reply.body.id;
        // modify project

        console.log('/api/projects/'+id+'/settings');
        var dataProject = {};
        dataProject.projectname = "aModifiedMartinEiffel";
        dataProject.description = "a new description";
        dataProject.language = "Eiffel";
        dataProject.ownerSet = [];
        dataProject.userSet = [];
        dataProject.code = eiffelProjectSettings.code;
        dataProject.isPrivate = true;
        dataProject.isSubmissionAllowed = eiffelProjectSettings.isSubmissionAllowed;
        dataProject.isLtiAllowed = true;
        dataProject.ltiKey = eiffelProjectSettings.ltiKey;
        dataProject.ltiSecret = eiffelProjectSettings.ltiSecret;
        dataProject.id = eiffelProjectSettings.id;

        // we iterate over ownerSet and userSet to make sure we only submit the usernames and no other data
        /*for(var index in eiffelProjectSettings.ownerSet) {
          dataProject.ownerSet.push(eiffelProjectSettings.ownerSet[index].username);
        }
        for(var index in eiffelProjectSettings.userSet) {
          dataProject.userSet.push(eiffelProjectSettings.userSet[index].username);
        }*/

        dataProject.ownerSet.push('martin');
        dataProject.userSet.push('hce');

        req
          .put('/api/projects/'+id+'/settings')
          .set('cookie', cookie2)
          .send(dataProject)
          //.expect('Content-Type', /json/)
          .expect(200)
          .end(function(error, reply) {
            if(error) return done(error);
            //console.log(reply.body);
            reply.body.message.should.equal('Project data saved.');
            done()
          });
      });


  });

  it('Projects: create Java project for martin; add user hce (modify settings)', function(done) {
    var data = {
      projectname: "aTestPrivateProjectMartin",
      description: "A project in Eiffel for testing",
      language: "Java",
      isPrivate: true
    };
    req
      .post('/api/projects')
      .set('cookie', cookie2)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(201)
      .end(function(error, reply) {
        if(error) return done(error);
        reply.body.message.should.equal('Successfully created project.');
        var id = reply.body.id;
        // modify project

        console.log('/api/projects/'+id+'/settings');
        var dataProject = {};
        dataProject.projectname = "aModifiedMartinEiffel";
        dataProject.description = "a new description";
        dataProject.language = "Java";
        dataProject.ownerSet = [];
        dataProject.userSet = [];
        dataProject.code = eiffelProjectSettings.code;
        dataProject.isPrivate = false;
        dataProject.isSubmissionAllowed = true;
        dataProject.isLtiAllowed = false;
        dataProject.ltiKey = eiffelProjectSettings.ltiKey;
        dataProject.ltiSecret = eiffelProjectSettings.ltiSecret;
        dataProject.id = eiffelProjectSettings.id;

        dataProject.ownerSet.push('martin');
        dataProject.userSet.push('hce');

        req
          .put('/api/projects/'+id+'/settings')
          .set('cookie', cookie2)
          .send(dataProject)
          //.expect('Content-Type', /json/)
          .expect(200)
          .end(function(error, reply) {
            if(error) return done(error);
            //console.log(reply.body);
            reply.body.message.should.equal('Project data saved.');
            done()
          });
      });
  });

  it('Projects: modify fails due to missing data', function(done) {
    console.log('/api/projects/'+eiffelId+'/settings');
    var dataProject = {};
    dataProject.projectname = "aModifiedEiffel";
    dataProject.description = "a new description";
    dataProject.id = eiffelProjectSettings.id;

    req
      .put('/api/projects/'+eiffelId+'/settings')
      .set('cookie', cookie)
      .send(dataProject)
      //.expect('Content-Type', /json/)
      .expect(400)
      .end(function(error, reply) {
        if(error) return done(error);
        //console.log(reply);
        //reply.body.message.should.equal('Project data saved.');
        done()
      });
  });

  it('Projects: get settings of modified Eiffel project', function(done) {
    console.log('/api/projects/'+eiffelId+'/settings');
    req
      .get('/api/projects/'+eiffelId+'/settings')
      .set('cookie', cookie)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(error, reply) {
        if(error) return done(error);
        eiffelProjectSettings = reply.body; //.message.should.equal('Successfully created project.');
        reply.body.projectname.should.equal('aModifiedEiffel');
        reply.body.description.should.equal('a new description');
        reply.body.language.should.equal('Eiffel');
        reply.body.ownerSet.length.should.equal(1);
        reply.body.userSet.length.should.equal(0);
        done()
      });
  });

  it('Projects: modify non-singned in user fails', function(done) {
    console.log('/api/projects/'+eiffelId+'/settings');
    var dataProject = eiffelProjectSettings;

    req
      .put('/api/projects/'+eiffelId+'/settings')
      .send(dataProject)
      .expect(401)
      .end(function(error, reply) {
        if(error) return done(error);
        done()
      });
  });

  it('Projects: modify invalid project fails', function(done) {
    console.log('/api/projects/'+eiffelId+50+'/settings');
    var dataProject = eiffelProjectSettings;

    req
      .put('/api/projects/'+eiffelId+50+'/settings')
      .set('cookie', cookie)
      .send(dataProject)
      .expect(404)
      .end(function(error, reply) {
        if(error) return done(error);
        done()
      });
  });

  it('Projects: modify non-owner project fails', function(done) {
    console.log('/api/projects/'+eiffelId+50+'/settings');
    var dataProject = eiffelProjectSettings;

    req
      .put('/api/projects/'+eiffelId+'/settings')
      .set('cookie', cookie2)
      .send(dataProject)
      .expect(401)
      .end(function(error, reply) {
        if(error) return done(error);
        done()
      });
  });

  it('Projects: log out', function(done) {
    req
      .del('/api/session')
      .set('cookie', cookie)
      .expect(200)
      .end(function(error, reply) {
        if(error) return done(error);
        //console.log(reply);
        done()
      });
  });



  it('Projects: get settings of after logout fails', function(done) {
    console.log('/api/projects/'+eiffelId+'/settings');
    req
      .get('/api/projects/'+eiffelId+'/settings')
      .set('cookie', cookie)
      .expect(401)
      .end(function(error, reply) {
        if(error) return done(error);
        done()
      });
  });

});
