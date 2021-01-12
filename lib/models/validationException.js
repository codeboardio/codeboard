/**
 * The db model for validation tests.
 * @author Janick Michot
 * @date 11.01.2021
 */


module.exports = function(sequelize, DataTypes) {
    let validationException = sequelize.define(
        'ValidationException',
        {
            // the title of the exception
            title: {
                type: DataTypes.STRING(36),
                notNull: true
            },

            // the description of the exception
            desc: {
                type: DataTypes.STRING(512)
            },

            // the search term. Depending on typ ether regex, flexible or simple
            matching:  {
                type: DataTypes.STRING(32),
                defaultValue: ''
            },

            // the validation test type
            type: {
                type: DataTypes.ENUM('regex', 'simple', 'flexible'),
                defaultValue: 'simple'
            },

            // reference to a language
            lang: {
                type: DataTypes.STRING(16),
                defaultValue: "Java"
            }
        }
    );

    validationException.associate = function(models) {
        validationException.hasMany(models.ValidationTextBlock, {
            as: 'textBlockSet',
            onDelete:'CASCADE',
            foreignKey: 'validationExceptionId'
        });
    };

    return validationException;
};
