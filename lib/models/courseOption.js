/**
 * Created by Janick Michot on 06.02.2020.
 *
 * The ORM model of course option
 */


module.exports = function(sequelize, DataTypes) {
    var Course = sequelize.define(
        'CourseOption',
        {
            // the name of the project
            option: DataTypes.STRING,

            // the description of the project
            value: DataTypes.STRING,
        }
    );

    Course.associate = function(models) {
    };

    return Course;
};


