/**
 * Created by hce on 1/19/15.
 *
 * The data model for projects as they are saved for 'users' but not 'owners'
 * of a project.
 *
 * At this stage, a userProject contains information to identify user and
 * project (via their id's) and a text field that contains a JSON array which
 * has all the details about the files of the user (e.g. filename, file content).
 *
 */


module.exports = function(sequelize, DataTypes) {
  var UserProject = sequelize.define(
    'UserProject',
    {
      lastUId: DataTypes.INTEGER,

      files: 'MEDIUMTEXT', // we're directly using the MySQL name 'MEDIUMTEXT' here; this might not be compatible with other database (e.g. postgre)

      isLastStoredByOwner: { // set this to true if the last version was stored by an owner and not the user herself
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      classMethods: {
        associate: function(models) {
          UserProject.belongsTo(models.Project, {as: 'project', foreignKeyConstraint: true, onDelete: 'CASCADE'});
          UserProject.belongsTo(models.User, {as: 'user', foreignKeyConstraint: true, onDelete: 'CASCADE'});
        }
      }
    }
  );

  return UserProject;
};