/**
 * Created by hce on 9/8/14.
 *
 * The database model for submissions.
 * It stores all the files that belong to the submission.
 * It stores the user who submitted if the user is known.
 */


module.exports = function(sequelize, DataTypes) {
  var Submission = sequelize.define(
    'Submission',
    {
      // does the project produce test results
      hasResult: DataTypes.BOOLEAN,

      // the test result (if any)
      testResult: {
        type: DataTypes.DECIMAL(7, 4), // store 7 places, with 4 to the right of the decimal (precision)
        defaultValue: -1
      },

      // number of passed tests
      numTestsPassed: {
        type: DataTypes.INTEGER,
        defaultValue: -1
      },

      // number of failed tests
      numTestsFailed: {
        type: DataTypes.INTEGER,
        defaultValue: -1
      },

      // stores all the data from the user's project (as a big JSON array)
      userFilesDump: 'MEDIUMTEXT', // Note: this 'hack' gets us the right data type for MYSQL; might not work with other DB systems

      // stores the files that were hidden by the time of the submission
      hiddenFilesDump: 'MEDIUMTEXT'// Note: this 'hack' gets us the right data type for MYSQL; might not work with other DB systems
    },
    {
      classMethods: {
        associate: function(models) {
          Submission.belongsTo(models.Project, {as: 'project', onDelete: 'CASCADE'});
          Submission.belongsTo(models.User, {as: 'user', constraints: false}); // Note: disable the default constraints of belongsTo because a submission might be by an anonymous user
          Submission.belongsTo(models.LtiSession, {as: 'ltiSession', constraints: false}); // Note: disable the default constraints of belongsTo because a submission might not have an associated LTI session
        }
      }
    }


  );

  return Submission;
};
