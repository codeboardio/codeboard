/**
 * The db model for error and exception placeholders.
 *
 * A placeholder is used to extract information from the output of a
 * program (also compilation output), ie. line number of an error.
 *
 * @author Janick Michot
 * @date 12.01.2021
 */


module.exports = function(sequelize, DataTypes) {
    let errAndExcHelpPlaceholder = sequelize.define(
        'ErrAndExcHelpPlaceholder',
        {
            // title of the placeholder
            title: {
                type: DataTypes.STRING(32),
                defaultValue: "",
                unique: true
            },

            // desc of the placeholder
            desc: {
                type: DataTypes.STRING(512),
                defaultValue: ""
            },

            // regex with which the corresponding value can be determined.
            regex:  {
                type: DataTypes.STRING(128),
                defaultValue: ''
            },
        }
    );

    errAndExcHelpPlaceholder.associate = function(models) {
        errAndExcHelpPlaceholder.belongsTo(models.Lang, {
           as: 'lang',
           foreignKey: { name: 'langId', allowNull: false }
        });
    };

    return errAndExcHelpPlaceholder;
};
