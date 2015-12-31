/**
 * Updated by hce on 5/4/15.
 *
 * Just some dummy data to fill the database.
 */


var db = require('../../../lib/models');

var ecfContent = '<?xml version=\"1.0\" encoding=\"ISO-8859-1\"?>\n<system xmlns=\"http:\/\/www.eiffel.com\/developers\/xml\/configuration-1-13-0\" xmlns:xsi=\"http:\/\/www.w3.org\/2001\/XMLSchema-instance\" xsi:schemaLocation=\"http:\/\/www.eiffel.com\/developers\/xml\/configuration-1-13-0 http:\/\/www.eiffel.com\/developers\/xml\/configuration-1-13-0.xsd\" name=\"project\" uuid=\"DD97E879-2536-4BF8-92F0-0AB9B5F0A683\">\n\t<target name=\"project\">\n\t\t<root feature=\"make\" class=\"APPLICATION\"\/>\n\t\t<option warning=\"true\">\n\t\t\t<assertions precondition=\"true\" postcondition=\"true\" check=\"true\" invariant=\"true\" loop=\"true\" supplier_precondition=\"true\"\/>\n\t\t<\/option>\n\t\t<setting name=\"console_application\" value=\"true\"\/>\n\t\t<precompile name=\"base_pre\" location=\"$ISE_PRECOMP\/base-safe.ecf\"\/>\n\t\t<library name=\"base\" location=\"$ISE_LIBRARY\/library\/base\/base-safe.ecf\"\/>\n\t\t<cluster name=\"project\" location=\".\\\" recursive=\"true\">\n\t\t\t<file_rule>\n\t\t\t\t<exclude>\/EIFGENs$<\/exclude>\n\t\t\t\t<exclude>\/.svn$<\/exclude>\n\t\t\t\t<exclude>\/CVS$<\/exclude>\n\t\t\t<\/file_rule>\n\t\t<\/cluster>\n\t<\/target>\n<\/system>';
var appContent = 'note\n\tdescription : \"root class of the application\"\n\tdate        : \"$Date$\"\n\trevision    : \"$Revision$\"\n\nclass\n\tAPPLICATION\n\ninherit\n\tARGUMENTS\n\ncreate\n\tmake\n\nfeature {NONE} -- Initialization\n\n\tmake\n\t\t\t-- Run application.\n\t\tdo\n\t\t\t--| Add your code here\n\t\t\tprint (\"Hello Eiffel World!%N\")\n\t\tend\n\nend\n';


var createUser1 = function () {
  return db.User.create(
    {
      username: 'hce',
      email: 'user1@testmail.com',
      password: '1234',
      url: 'http://codeboard.io/users/hce',
      location: 'Switzerland',
      institution: 'ETH Zurich',
      imageUrl: '/images/users/defaults/smile6.png'
    }
  );
};


var createUser2 = function () {
  return db.User.create({
    username: 'martin',
    email: 'user2@testmail.com',
    password: '1234',
    imageUrl: '/images/users/defaults/smile3.png'
  });
};


var createUser3 = function () {
  return db.User.create(
    {
      username: 'other',
      email: 'user3@testmail.com',
      password: '1234',
      imageUrl: '/images/users/defaults/smile3.png'
    }
  );
};


var createProject1 = function() {
  return db.Project.create(
    {
      projectname: 'Bank Account',
      language: 'Eiffel',
      description: 'The infamous bank account example. It is a beginners example that mainly shows how to use Design-by-Contract.',
      isPrivate: false,
      lastUId: 1,
      isLtiAllowed: false
    }
  );
};


var createProject2 = function() {
  return db.Project.create(
    {
      projectname: 'Bank Account',
      language: 'Eiffel',
      description: 'The infamous bank account example. It is a beginners example that mainly shows how to use Design-by-Contract.',
      isPrivate: false,
      lastUId: 1,
      isLtiAllowed: false
    }
  );
};


var createProject3 = function() {
  return db.Project.create(
    {
      projectname: 'Eiffel loops',
      language: 'Eiffel',
      description: 'Eiffel has two types of loops. Both are demonstrated in this project. This is a good exercise to understand iterators.',
      isPrivate: true,
      lastUId: 1,
      isLtiAllowed: false
    }
  );
};


var createProject4 = function() {
  return db.Project.create(
    {
      projectname: 'CProject',
      language: 'C',
      description: 'A C project',
      isPrivate: false,
      lastUId: 1,
      isLtiAllowed: false
    }
  );
};


var createProject5 = function() {
  return db.Project.create(
    {
      projectname: 'CppProject',
      language: 'C++',
      description: 'A Cpp project',
      isPrivate: false,
      lastUId: 1,
      isLtiAllowed: false
    }
  );
};


var createProject6 = function() {
  return db.Project.create(
    {
      projectname: 'pythonProject',
      language: 'Python',
      description: 'A python project',
      isPrivate: false,
      lastUId: 1,
      isLtiAllowed: false
    }
  );
};


var createProject7 = function() {
  return db.Project.create(
    {
      projectname: 'JavaProject',
      language: 'Java',
      description: 'A Java project',
      isPrivate: false,
      lastUId: 1,
      isLtiAllowed: false
    }
  );
};

var createProject8 = function() {
  return db.Project.create(
    {
      projectname: 'HaskellProject',
      language: 'Haskell',
      description: 'A Haskell project',
      isPrivate: false,
      lastUId: 1,
      isLtiAllowed: false
    }
  );
};


var createFile1 = function() {
  return db.File.create(
    {
      filename: 'RootFolder',
      path: '',
      uniqueId: 0,
      parentUId: -1,
      isFolder: true,
      content: '',
      isHidden: false
    }
  );
};


var createFile2 = function() {
  return db.File.create(
    {
      filename: 'Application.e',
      path: 'RootFolder',
      uniqueId: 1,
      parentUId: 0,
      isFolder: false,
      content: 'class APPLICATION end',
      isHidden: false
    }
  );
}


var createDbDummyData = function () {

  var user1, user2, users3;
  var project1, project2, project3, project4, project5, project6, project7, project8;
  var file1, file2;

  return createUser1()
    .then(function(usr) {
      user1 = usr;
      return createUser2();
    })
    .then(function(usr) {
      user2 = usr;
      return createUser3();
    })
    .then(function(usr) {
      user3 = usr;
      return createProject1();
    })
    .then(function(prj) {
      project1 = prj;
      return createProject2();
    })
    .then(function(prj) {
      project2 = prj;
      return createProject3();
    })
    .then(function(prj) {
      project3 = prj;
      return createProject4();
    })
    .then(function(prj) {
      project4 = prj;
      return createProject5();
    })
    .then(function(prj) {
      project5 = prj;
      return createProject6();
    })
    .then(function(prj) {
      project6 = prj;
      return createProject7();
    })
    .then(function(prj) {
      project7 = prj;
      return createProject8();
    })
    .then(function(prj) {
      project8 = prj;
      return createFile1();
    })
    .then(function(file) {
      file1 = file;
      return createFile2();
    })
    .then(function(file) {
      file2 = file;


      var p = [];

      //console.log(project1);
      //console.log(user1);
      p[0] = project1.setOwnerSet([user1]);
      p[1] = project1.setUserSet([user2]);

      p[2] = project2.setOwnerSet([user2]);
      p[3] = project2.setUserSet([user1, user2]);

      p[4] = project3.setOwnerSet([user2]);
      p[5] = project3.setUserSet([user1]);

      p[6] = project4.setOwnerSet([user2]);
      p[7] = project4.setUserSet([user1]);

      p[8] = project5.setOwnerSet([user2]);
      p[9] = project5.setUserSet([user1]);

      p[10] = project6.setOwnerSet([user2]);
      p[11] = project6.setUserSet([user1]);

      p[12] = project7.setOwnerSet([user2]);
      p[13] = project7.setUserSet([user1]);

      p[14] = project8.setOwnerSet([user1]);
      p[15] = project8.setUserSet([user2]);

      p[16] = project1.setFileSet([file1, file2]);

      return Promise.all(p);
    })
    .catch(function(err) {
      console.log('dbDummyDatajs error:' + JSON.stringify(err));
      return Promise.reject(err);
    });
};


module.exports = {
  createDbDummyData: createDbDummyData
};
