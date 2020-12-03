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
    var CompilationError = sequelize.define(
        'CompilationError',
        {
            // stores the output of the execution. This can either be the compilation, a program output ..
            output: 'MEDIUMTEXT',

            // stores all the data from the user's project (as a big JSON array)
            userFilesDump: 'MEDIUMTEXT', // Note: this 'hack' gets us the right data type for MYSQL; might not work with other DB systems

            // stores the files that were hidden by the time of the submission
            hiddenFilesDump: 'MEDIUMTEXT', // Note: this 'hack' gets us the right data type for MYSQL; might not work with other DB systems

            // the response from the compilation error message service
            responseMessage: {
                type: DataTypes.TEXT,
                default: ""
            },

            // students rating for the generated response text
            rating: {
                type: DataTypes.INTEGER(1),
                validate: {
                    min: 0,
                    max: 5
                },
                default: 0
            }
        }
    );

    CompilationError.associate = function(models) {
        CompilationError.belongsTo(models.Project, {as: 'project', onDelete: 'CASCADE'});
        CompilationError.belongsTo(models.Course, {as: 'course'});
        CompilationError.belongsTo(models.User, {as: 'user'}); // Note: disable the default constraints of belongsTo because a userVersion might be by an anonymous user
    };

    return CompilationError;
};
