/**
 * The db model for error and exception help sets.
 *
 * A error and exception help set is a bundle of text blocks and
 * placeholders that which together form an automatic help for a certain
 * programming language. A set can belong to one or many courses.
 *
 * @author Janick Michot
 * @date 12.01.2021
 */


module.exports = function(sequelize, DataTypes) {
    let errAndExcHelpSet = sequelize.define(
        'ErrAndExcHelpSet',
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
            }
        }
    );

    errAndExcHelpSet.associate = function(models) {
        errAndExcHelpSet.belongsToMany(models.Course, {
            as: 'courseSet',
            foreignKey: 'errAndExcHelpSetId'
        });
        errAndExcHelpSet.belongsTo(models.User, {
            as: 'user',
            foreignKey: 'userId'
        });
        errAndExcHelpSet.hasMany(models.ErrAndExcHelpTextBlock, {
            as: 'textBlocks',
            onDelete:'CASCADE',
            foreignKey: 'setId'
        });
        errAndExcHelpSet.belongsTo(models.Lang, {
            as: 'lang',
            foreignKey: { name: 'langId', allowNull: false }
        });
    };

    return errAndExcHelpSet;
};
