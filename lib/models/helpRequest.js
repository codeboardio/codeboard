/**
 * Created by hce on 16/12/19.
 *
 * The database model for help requests.
 * It stores all the files that belong to a help request.
 * It stores the user who submitted if the user is known.
 *
 * @author Janick Michot
 */


module.exports = function(sequelize, DataTypes) {
  var HelpRequest = sequelize.define(
    'HelpRequest',
    {
      // status of this help request (open, pending, resolved ...)
      status: DataTypes.STRING,

      // stores all the data from the user's project (as a big JSON array)
      userFilesDump: 'MEDIUMTEXT', // Note: this 'hack' gets us the right data type for MYSQL; might not work with other DB systems

      // stores the files that were hidden by the time of the submission
      hiddenFilesDump: 'MEDIUMTEXT'// Note: this 'hack' gets us the right data type for MYSQL; might not work with other DB systems
    }
  );

    HelpRequest.associate = function(models) {
        HelpRequest.hasMany(models.ChatLine, {as: "subject", foreignKey: "subjectId", onDelete: 'CASCADE'});
        HelpRequest.belongsTo(models.Project, {as: 'project', onDelete: 'CASCADE'});
        HelpRequest.belongsTo(models.User, {as: 'user', constraints: false}); // Note: disable the default constraints of belongsTo because a request might be by an anonymous user
        HelpRequest.belongsTo(models.LtiSession, {as: 'ltiSession', constraints: false}); // Note: disable the default constraints of belongsTo because a request might not have an associated LTI session
        HelpRequest.belongsTo(models.Course, {as: 'course', foreignKeyConstraint: true, constraints: false}); // Note: disable the default constraints of belongsTo because a request might not have a course
    };

  return HelpRequest;
};
