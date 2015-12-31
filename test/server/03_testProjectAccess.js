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
var eiffelPrivateId, eiffelPublicId, cPublicId, javaPrivateId, javaPublicId, haskellPrivateId, haskellPublicId;
var eiffelUserPrivateId;
var projectContent; // the content of an Eiffel project

function extractOwnerProjectIds(ownerSet) {
  for (index = 0; index < ownerSet.length; ++index) {
    var item = ownerSet[index];
    if (item.language=='Eiffel' && item.isPrivate==true) {
      eiffelPrivateId = item.id;
    }
    if (item.language=='Eiffel' && item.isPrivate==false) {
      eiffelPublicId = item.id;
    }
    if (item.language=='Haskell' && item.isPrivate==true) {
      haskellPrivateId = item.id;
    }
    if (item.language=='Haskell' && item.isPrivate==false) {
      haskellPublicId = item.id;
    }
    if (item.language=='Java' && item.isPrivate==true) {
      javaPrivateId = item.id;
    }
    if (item.language=='Java' && item.isPrivate==false) {
      javaPublicId = item.id;
    }
    if (item.language=='C' && item.isPrivate==false) {
      cPublicId = item.id;
    }
  }
}

function extractUserProjectIds(userSet) {
  for (index = 0; index < userSet.length; ++index) {
    var item = userSet[index];
    if (item.language=='Eiffel' && item.isPrivate==true) {
      eiffelUserPrivateId = item.id;
    }
  }
}

function extractHasHiddenFile (fileSet) {
  for (index = 0; index < fileSet.length; ++index) {
    var item = fileSet[index];
    if (item.isHidden) {
      return true;
    }
  }
  return false;
}

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
            // get all projects of Martin
              req
                .get('/api/users/hce/projects')
                .set('cookie', cookie)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(error, reply) {
                  if(error) return done(error);
                  //console.log(reply.body);
                  extractOwnerProjectIds(reply.body.ownerSet);
                  extractUserProjectIds(reply.body.userSet);
                  //expect(reply.body.ownerSet).to.have.length.above(8);
                  done()
                });
          });
      });
  });


  //var eiffelPrivateId, eiffelPublicId, cPublicId, javaPrivateId, javaPublicId, haskellPrivateId, haskellPublicId;


   it('Project Access: owner access to a private Eiffel project', function(done) {
     console.log('/api/projects/'+eiffelPrivateId);
     req
       .get('/api/projects/'+eiffelPrivateId)
       .set('cookie', cookie)
       .expect('Content-Type', /json/)
       .expect(200)
       .end(function(error, reply) {
         if(error) return done(error);
         //console.log(reply.body);
         var hasHiddenFile = extractHasHiddenFile(reply.body.fileSet);
         hasHiddenFile.should.equal(true);
         expect(reply.body.fileSet).to.have.length.above(2);

         done()
       });
   });


  it('Project Access: user access to a private Eiffel project', function(done) {
    console.log('/api/projects/18'); //'+eiffelUserPrivateId);
    req
      .get('/api/projects/18')
      .set('cookie', cookie)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(error, reply) {
        if(error) return done(error);
        //console.log(reply.body);
        //var hasHiddenFile = extractHasHiddenFile(reply.body.fileSet);
        //hasHiddenFile.should.equal(true);
        //expect(reply.body.fileSet).to.have.length.above(2);
        done()
      });
  });


  it('Project Access: owner access to a public Eiffel project', function(done) {

    req
      .get('/api/projects/' + eiffelPublicId)
      .set('cookie', cookie)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(error, reply) {
        if(error) {
          return done(error);
        }
        else {
          console.log('\n/api/projects/' + eiffelPublicId);
          console.log('### Debug output ####\n' + JSON.stringify(reply.body));
          var hasHiddenFile = extractHasHiddenFile(reply.body.fileSet);
          hasHiddenFile.should.equal(true);
          expect(reply.body.fileSet).to.have.length.above(2);
          done()
        }
      });
  });

  it('Project Access: non-owner access to a public Eiffel project', function(done) {
    console.log('/api/projects/'+eiffelPublicId);
    req
      .get('/api/projects/'+eiffelPublicId)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(error, reply) {
        if(error) return done(error);
        //console.log(reply.body);
        var hasHiddenFile = extractHasHiddenFile(reply.body.fileSet);
        hasHiddenFile.should.equal(false);
        expect(reply.body.fileSet).to.have.length.above(1);
        done()
      });
  });


  it('Project Access:: fail to access private project', function(done) {
    req
      .get('/api/projects/'+eiffelPrivateId)
      .expect(401)
      .end(function(error, reply) {
        if(error) return done(error);
        done()
      });
  });

  it('Project Access:: fail to access unknown project', function(done) {
    var unkownId = 68964;
    req
      .get('/api/projects/'+unkownId)
      .expect(404)
      .end(function(error, reply) {
        if(error) return done(error);
        done()
      });
  });

  it('Project Access:: owner fails to access unknown project', function(done) {
    var unkownId = 68964;
    req
      .get('/api/projects/'+unkownId)
      .set('cookie', cookie)
      .expect(404)
      .end(function(error, reply) {
        if(error) return done(error);
        done()
      });
  });

  it('Project Access: modify a private project', function(done) {
    req
      .get('/api/projects/'+javaPrivateId)
      .set('cookie', cookie)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(error, reply) {
        projectContent = reply.body;
        projectContent.lastUId = projectContent.lastUId + 1;

        var aFile = {
          id: -1,
          filename: 'aNewFile.java',
          path: 'Root',
          uniqueId: projectContent.lastUId,
          parentUId: 0,
          isFolder: false,
          content: "a new file in Java done in tests",
          isHidden: false
        };
        projectContent.fileSet.push(aFile);

        var payload = {
          project: {
            lastUId: projectContent.lastUId
          },
          files: projectContent.fileSet
        };

        console.log('/api/projects/'+javaPrivateId);
        req
          .put('/api/projects/'+javaPrivateId)
          .set('cookie', cookie)
          .send(payload)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(error, reply) {
            if(error) return done(error);
            console.log(reply.body);
            reply.body.message.should.be.equal('Project successfully updated.');
            done();
          });
      });
  });
});
