/**
 * The db model for validation test sets.
 *
 * @author Janick Michot
 * @date 11.01.2021
 */


module.exports = function(sequelize, DataTypes) {
    let validationSet = sequelize.define(
        'ValidationSet',
        {
            // title of the set
            title:  {
                type: DataTypes.STRING(36),
                defaultValue: ''
            },

            // description of the set
            desc: {
                type: DataTypes.STRING(512),
                defaultValue: ''
            },

            // language
            language: {
                type: DataTypes.STRING,
                defaultValue: 'Java'
            }
        }
    );

    validationSet.associate = function(models) {
        validationSet.belongsToMany(models.Course, {
            as: 'courseSet',
            through: 'CourseValidationSet'
        });
        validationSet.hasMany(models.ValidationPlaceholder, {
            as: 'placeholderSet',
            onDelete:'CASCADE',
            foreignKey: 'validationSetId'
        });
        validationSet.hasMany(models.ValidationTextBlock, {
            as: 'textBlockSet',
            onDelete:'CASCADE',
            foreignKey: 'validationSetId'
        });
    };

    return validationSet;
};
