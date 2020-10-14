/**
 * Created by hce on 16/12/19.
 *
 * The database model for user versions.
 * The primary use of this model is to store user versions on
 * compilation errors. This is used to analyze and improve
 * automatic response on compilation errors.
 *
 * @author Janick Michot
 */


module.exports = function(sequelize, DataTypes) {
    var UserVersion = sequelize.define(
        'UserVersion',
        {
            // type of this user version
            type: {
                type: DataTypes.ENUM,
                values: ['compilation', 'run']
            },

            // the status of an execution. eg. compilationError, runtimeError, successfulRun
            status: DataTypes.STRING,

            // stores the output of the execution. This can either be the compilation, a program output ..
            output: 'MEDIUMTEXT',

            // stores all the data from the user's project (as a big JSON array)
            userFilesDump: 'MEDIUMTEXT', // Note: this 'hack' gets us the right data type for MYSQL; might not work with other DB systems

            // stores the files that were hidden by the time of the submission
            hiddenFilesDump: 'MEDIUMTEXT'// Note: this 'hack' gets us the right data type for MYSQL; might not work with other DB systems
        }
    );

    UserVersion.associate = function(models) {
        UserVersion.belongsTo(models.Project, {as: 'project', onDelete: 'CASCADE'});
        UserVersion.belongsTo(models.User, {as: 'user', constraints: false}); // Note: disable the default constraints of belongsTo because a request might be by an anonymous user
    };

    return UserVersion;
};
