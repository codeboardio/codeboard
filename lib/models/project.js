/**
 * Created by haches on 7/7/14.
 *
 * The ORM model of project.
 *
 * todo
 *  Project.hasMany(models.HelpRequest, {as: 'helpRequestSet', foreignKey: 'projectId'});
 *  Project.hasMany(models.Submission, {as: 'SubmissionSet', foreignKey: 'projectId'});
 *  Project.hasMany(models.UserProject, {as: 'UserProjectSet', foreignKey: 'projectId'});
 */


module.exports = function(sequelize, DataTypes) {
  var Project = sequelize.define(
    'Project',
    {
      // the name of the project
      projectname: DataTypes.STRING,

      // the programming language of the project
      language: DataTypes.STRING,

      // the description of the project
      description: DataTypes.TEXT,

      // the last id used in the project (for managing files)
      lastUId: DataTypes.INTEGER,

      // the code that user can use to gain access to a project
      code: {type: DataTypes.STRING, defaultValue: '42'},

      // is the project a private project
      isPrivate: {type: DataTypes.BOOLEAN, defaultValue: false},

      // does the project allow users to submit their solutions, e.g. through a submit-button
      isSubmissionAllowed: {type: DataTypes.BOOLEAN, defaultValue: false},

      // is the availability of the project restricted to a certain time frame
      isTimeRestricted: {type: DataTypes.BOOLEAN, defaultValue: false},

      // the start time when a timely restricted project becomes available
      timeRestricitonStart: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},

      // the end time after which a timely restricted project is available
      timeRestrictionEnd: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},

      // is the access to the project via LTI allowed
      isLtiAllowed: {type: DataTypes.BOOLEAN, defaultValue: false},

      // the lti key
      ltiKey: {type: DataTypes.STRING, defaultValue: ''},

      // the lti secret
      ltiSecret: {type: DataTypes.STRING, defaultValue: ''}
    }
  );

    Project.associate = function(models) {

        // users and owners
        Project.belongsToMany(models.User, {as: 'ownerSet', through: 'ProjectsOwners'});
        Project.belongsToMany(models.User, {as: 'userSet', through: 'ProjectsUsers'});

        // courseSet and fileSet
        Project.belongsToMany(models.Course, {as: 'courseSet', through: 'CourseProjects'});
        Project.hasMany(models.File, {as: 'fileSet'});

        // for easier access to the task files we define them separately
        Project.hasOne(models.File, {as: 'configFile', foreignKey: 'ProjectId'});
        Project.hasOne(models.File, {as: 'projectDescription', foreignKey: 'ProjectId'});
        Project.hasOne(models.File, {as: 'sampleSolution', foreignKey: 'ProjectId'});

        // chat
        Project.hasMany(models.ChatLine, {as: 'chatLineSet', foreignKey: 'ProjectId'});
    };

  return Project;
};


