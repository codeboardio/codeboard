/**
 * The db model for a error and exception help identifier.
 *
 * An identifier represents a condition that must be present in the
 * output of a programme in order to conclude that an exception has occurred.
 *
 * @author Janick Michot
 * @date 11.01.2021
 */


module.exports = function(sequelize, DataTypes) {
    let errAndExcHelpException = sequelize.define(
        'ErrAndExcHelpException',
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
                type: DataTypes.STRING(128),
                defaultValue: ''
            },

            // the validation test type
            matching_type: {
                type: DataTypes.ENUM('regex', 'simple', 'flexible'),
                defaultValue: 'simple'
            },

            // determines the phase when a exception/error occurs
            phase: {
                type: DataTypes.STRING(16),
                defaultValue: 'run'
            },

            // the priority is used when multiple exceptions fit in one output
            priority: {
                type: DataTypes.SMALLINT,
                defaultValue: 1,
                notNull: true
            }
        }
    );

    errAndExcHelpException.associate = function(models) {
        errAndExcHelpException.hasMany(models.ErrAndExcHelpTextBlock, {
            as: 'textBlockSet',
            onDelete:'CASCADE',
            foreignKey: {name: 'exceptionId', allowNull: true }
        });
        errAndExcHelpException.belongsTo(models.Lang, {
            as: 'lang',
            foreignKey: { name: 'langId', allowNull: false }
        });
    };

    return errAndExcHelpException;
};
