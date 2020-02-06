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
            description: DataTypes.TEXT
        }
    );

    Course.associate = function(models) {
        Course.belongsToMany(models.User, {as: 'courseOwnerSet', through: 'CourseOwners'});
        Course.belongsToMany(models.User, {as: 'courseUserSet', through: 'CourseUsers'});
        Course.belongsToMany(models.Project, {as: 'projectSet', through: 'CourseProjects'});
    };

    return Course;
};


