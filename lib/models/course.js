/**
 * Created by Janick Michot on 06.02.2020.
 *
 * The ORM model of course
 */


module.exports = function(sequelize, DataTypes) {
    var Course = sequelize.define(
        'Course',
        {
            // the name of the project
            coursename: DataTypes.STRING,

            // the description of the project
            description: DataTypes.TEXT,

            // the moodle identification for this course
            contextId: {
                type: DataTypes.STRING,
                unique: true
            }
        }
    );

    Course.associate = function(models) {
        Course.belongsToMany(models.User, {as: 'courseOwnerSet', through: 'CourseOwners'});
        Course.belongsToMany(models.User, {as: 'courseUserSet', through: 'CourseUsers'});
        Course.belongsToMany(models.Project, {as: 'projectSet', through: 'CourseProjects'});

        Course.hasMany(models.HelpRequest, {as: 'helpRequestSet', foreignKey: 'courseId'});
        Course.hasMany(models.Submission, {as: 'submissionSet', foreignKey: 'courseId'});
        Course.hasMany(models.UserProject, {as: 'userProjectSet', foreignKey: 'courseId'});

        Course.belongsTo(models.ErrAndExcHelpSet, {as: 'errAndExcHelpSet', foreignKey: 'errAndExcHelpSetId'});

        Course.hasMany(models.CourseOption, {as: 'courseOptions', foreignKey: 'courseId'});
    };

    return Course;
};


