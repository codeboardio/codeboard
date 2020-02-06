'use strict';

var index = require('./controllers/index.js'),
  authCtrl = require('./controllers/authenticationCtrl.js'),
  projectCtrl = require('./controllers/projectCtrl.js'),
  courseCtrl = require('./controllers/courseCtrl.js'),
  userCtrl = require('./controllers/userCtrl.js'),
  uploadCtrl = require('./controllers/uploadCtrl.js'),
  mw = require('./middleware.js'),
  logCtrl = require('./controllers/logCtrl.js'),
  supportCtrl = require('./controllers/supportCtrl.js'),
  chatCtrl = require('./controllers/chatCtrl.js');


var db = require('./models/index.js');
var util = require('./util.js');

/**
 * Application routes
 */
module.exports = function(app) {

  /** Routes related to a session **/

  app.get('/api/session', authCtrl.isAuthenticated);
  app.post('/api/session', authCtrl.login);
  app.delete('/api/session', authCtrl.logout);


  /** Route to reset the password */

  app.put('/api/passwordReset', authCtrl.resetPassword);


  /** Routes related to users **/

  app.get('/api/users', userCtrl.getUsers); // get profile of a user, details vary based ownership
  app.post('/api/users', userCtrl.createUser); // create a new user

  app.get('/api/users/:username', userCtrl.getUser);

  app.post('/api/users/:username/settings/userImage', mw.isAuth, mw.isSelf, uploadCtrl.userImage); // update the user profile picture
  app.get('/api/users/:username/settings', mw.isAuth, mw.isSelf, userCtrl.getUserSettings); // get the user data for displaying in the settings form; this contains data that otherwise should be secret, e.g. the non-public email of the user
  app.put('/api/users/:username/settings', mw.isAuth, mw.isSelf, userCtrl.putUserSettings); // update the user data
  app.put('/api/users/:username/settings/password', mw.isAuth, mw.isSelf, userCtrl.putPassword); // update the user's password

  // routes for projects that are linked to a user
  app.get('/api/users/:username/projects', projectCtrl.getUserProjects); // get all projects of a user

  // get the version of a project for displaying in the IDE as it has been stored by a user (UserProject)
  app.get('/api/users/:username/projects/:projectId', mw.isAuth, mw.isValidProjectId, mw.isUserElseNextRoute, projectCtrl.getUserProject); // user must have access rights to retrieve her version of the project
  app.get('/api/users/:username/projects/:projectId', mw.isLtiUserElseNextRoute, projectCtrl.getUserProject); // (assume: isAuth, isValidProjectId) project may be private but current user is an LTI user
  app.get('/api/users/:username/projects/:projectId', mw.isPublicProject, projectCtrl.getUserProject); // (assume: isAuth, validProjectId) project is public so every user can retrieve her version of the project


  /** Routes related to courses **/
  app.post('/api/courses', mw.isAuth, courseCtrl.createCourseForUser);
  app.get('/api/users/:username/courses/owner', mw.isAuth, mw.isSelf, courseCtrl.getUserCourses);
  app.get('/api/courses/:courseId', mw.isValidCourseId, courseCtrl.getCourse);
  app.get('/api/courses/:courseId/projects', mw.isValidCourseId, courseCtrl.getCourseProjects);


  /** Routes related to multiple projects **/

  app.get('/api/projects', projectCtrl.getAllProjects); // get all public projects
  app.get('/api/projects/featured', projectCtrl.getAllFeaturedProjects); // get all featured projects
  app.post('/api/projects', mw.isAuth, projectCtrl.createProjectForUser); // create a new project


  /** Routes related to a project **/

  app.post('/api/projects/:projectId/projectImage', mw.isAuth, uploadCtrl.projectImage); // upload project image


  // route that's only used to check if the current user is an owner of the project
  // (used in Angular's router at "resolve" time to prevent rendering of pages a user is not authorized to see)
  app.get('/api/projects/:projectId/authorizedownercheck', mw.isOwner, projectCtrl.isAuthorizedOwner);

  // routes for the settings of a project
  app.get('/api/projects/:projectId/settings', mw.isValidProjectId, mw.isAuth, mw.isOwner, projectCtrl.getProjectSettings);
  app.put('/api/projects/:projectId/settings', mw.isValidProjectId, mw.isAuth, mw.isOwner, projectCtrl.putProjectSettings);

  // Note: the following routes use "next('route')" in the middleware; Note: the follow-up routes don't do redundant checks for isValidProject
  // if the project id is valid, the user is authenticated and the owner, load the full project
  app.get('/api/projects/:projectId', mw.isValidProjectId, mw.isAuthElseNextRoute, mw.isOwnerElseNextRoute, projectCtrl.getFullProject);
  // (if the project id is valid) the user is authenticated and a user of the project, load the limited view of the project
  app.get('/api/projects/:projectId', mw.isAuthElseNextRoute, mw.isUserElseNextRoute, projectCtrl.getLimitedProject);

  app.get('/api/projects/:projectId', mw.isLtiUserElseNextRoute, projectCtrl.getLimitedProject);
  // (if the project id is valid) and the project is public, load the limited view of the project
  app.get('/api/projects/:projectId', mw.isPublicProject, projectCtrl.getLimitedProject);

  // update a project (for project owners) or save a version (for project users)
  app.put('/api/projects/:projectId', mw.isValidProjectId, mw.isAuth, mw.isOwnerElseNextRoute, projectCtrl.putProject); // current user is owner, so we modify the actual project
  app.put('/api/projects/:projectId', mw.isValidProjectId, mw.isAuth, mw.isUserElseNextRoute, projectCtrl.putProjectForUser); // current user has access rights to project, so we save a version for the user
  app.put('/api/projects/:projectId', mw.isValidProjectId, mw.isAuth, mw.isLtiUserElseNextRoute, projectCtrl.putProjectForUser); // current user has no access rights but connects via LTI which overrides the access rights
  app.put('/api/projects/:projectId', mw.isValidProjectId, mw.isAuth, mw.isPublicProject, projectCtrl.putProjectForUser); // project is public, so we can save a version for every authenticated user

  // delete a project
  app.delete('/api/projects/:projectId', mw.isValidProjectId, mw.isAuth, mw.isOwner, projectCtrl.deleteProject);

  // run operations on a project (e.g. compile, run, test); Note: the follow-up routes don't do redundant checks for isValidProject
  app.post('/api/projects/:projectId', mw.isValidProjectId, mw.isAuthElseNextRoute, mw.isOwnerElseNextRoute, projectCtrl.runActionOnProject);
  app.post('/api/projects/:projectId', mw.isAuthElseNextRoute, mw.isUserElseNextRoute, projectCtrl.runLimitedActionOnProject);
  app.post('/api/projects/:projectId', mw.isLtiUserElseNextRoute, projectCtrl.runLimitedActionOnProject);
  app.post('/api/projects/:projectId', mw.isPublicProject, projectCtrl.runLimitedActionOnProject);


  /** Routes for the summary of a project */

  // to a the summary of a project, the project must be public, or the current user must be owner or user of the project (then it can be private)
  app.get('/api/projects/:projectId/summary', mw.isValidProjectId, mw.isAuthElseNextRoute, mw.isOwnerOrUserElseNextRoute, projectCtrl.getProjectSummary);
  app.get('/api/projects/:projectId/summary', mw.isPublicProject, projectCtrl.getProjectSummary);


  /** Routes  used when an LTI Tool Consumer wants a access a project */

  // route where the Tool Consumer posts the basic LTI data
  app.post('/lti/projects/:projectId', mw.isValidProjectId, mw.isLtiRequestAuthorized, mw.isAuthElseNextRoute, projectCtrl.initLtiSession);
  app.post('/lti/projects/:projectId', mw.isReturningLtiUserElseNextRoute, authCtrl.authenticateLtiUserElseNextRoute, projectCtrl.initLtiSession);
  app.post('/lti/projects/:projectId', mw.isLtiUserCreatableElseNextRoute, authCtrl.authenticateLtiUserElseNextRoute, projectCtrl.initLtiSession);
  // app.post('/lti/projects/:projectId', projectCtrl.initLtiSessionWithoutUser); isLtiUserCreatableElseNextRoute


  /** Route to handle submissions */

  app.get('/api/projects/:projectId/submissions', mw.isValidProjectId, mw.isAuth, mw.isOwner, projectCtrl.getAllSubmissions);
  // handle a new submission of a student solution
  app.post('/api/projects/:projectId/submissions', mw.isValidProjectId, projectCtrl.createSubmission);
  app.get('/api/projects/:projectId/submissions/:submissionId', mw.isValidProjectIdAndSubmissionIdCombo, mw.isAuth, mw.isOwner, projectCtrl.getSubmission);


  /** Route to handle help requests */

  app.get('/api/projects/:projectId/helpRequests', mw.isValidProjectId, mw.isAuth, mw.isOwner, projectCtrl.getAllHelpRequests);
  app.post('/api/projects/:projectId/helpRequests', mw.isValidProjectId, projectCtrl.createHelpRequest);
  app.put('/api/projects/:projectId/helpRequests', mw.isValidProjectId, projectCtrl.updateHelpRequest);
  app.get('/api/projects/:projectId/helpRequests/:helpRequestId', mw.isValidProjectIdAndHelpRequestIdCombo, mw.isAuth, mw.isOwner, projectCtrl.getHelpRequest);

  /** Routes for versions of a project stored by users */

  app.get('/api/projects/:projectId/userprojects', mw.isValidProjectId, mw.isAuth, mw.isOwner, projectCtrl.getAllUserProjectsForProject);
  app.get('/api/projects/:projectId/userprojects/:userprojectId', mw.isValidProjectIdAndUserprojectIdCombo, mw.isAuth, mw.isOwner, projectCtrl.getUserProjectForProject);


  /** Routes used for logging functionality */

  app.get('/api/log/user/summaryProjectAccess/:projectId', mw.isValidProjectId, mw.isAuth, mw.isOwner, logCtrl.getProjectAccessPerProjectLogs);
  app.get('/api/log/user/summaryCompiler/:projectId', mw.isValidProjectId, mw.isAuth, mw.isOwner, logCtrl.getCompilerActivityPerProjectLogs);
  app.get('/api/log/user/summarySubmitAccess/:projectId', mw.isValidProjectId, mw.isAuth, mw.isOwner, logCtrl.getSubmitPerProjectLogs);
  app.get('/api/log/user/summaryProjectCompilationRunDay/:projectId', mw.isValidProjectId, mw.isAuth, mw.isOwner, logCtrl.getCompilationPerDayLogs); // get the summary of compilation and run per day for a project id
  app.get('/api/log/user/summaryProjectAccessDay/:projectId', mw.isValidProjectId, mw.isAuth, mw.isOwner, logCtrl.getProjectAccessPerDayLogs); // get the summary of user access per day for a project id


  /** Routes for the help and chat functionality */

  app.post('/api/chat/:username/:projectId', mw.isValidProjectId, mw.isAuth, chatCtrl.addChatLine);
  app.get('/api/chat/:username/:projectId', mw.isValidProjectId, mw.isAuth, chatCtrl.getChatHistory);



  /** Routes for the support and debugging functionality */

  app.post('/support/lti/debug', supportCtrl.initLtiSession);
  app.put('/support/lti/debug/outcome', supportCtrl.sendOutcome);


  /** Routes to start and stop container */

  app.get('/api/startContainer/:mantraId/:containerId/start', projectCtrl.startContainer);
  app.get('/api/stopContainer/:mantraId/:containerId/stop', projectCtrl.stopContainer);


  // All undefined api routes should return a 404
  app.get('/api/*', function(req, res) {
    res.send(404);
  });


  // All other routes to use Angular routing in app/scripts/app.js
  app.get('/partials/*', index.partials);

  app.get('/*', index.index);
};
