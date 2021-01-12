/**
 * The db model for validation placeholders
 *
 * todo Also make placeholders available for project specific logical testing?
 *  If so we n
 *  ie. "Gewicht: 42 kg" => Gewicht von {{kg}} ist zu leicht für einen Bungee-Sprung
 *
 * @author Janick Michot
 * @date 11.01.2021
 */


module.exports = function(sequelize, DataTypes) {
    let validationPlaceholder = sequelize.define(
        'ValidationPlaceholder',
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
                type: DataTypes.STRING(32),
                defaultValue: ''
            },
        }
    );

    validationPlaceholder.associate = function(models) {
        validationPlaceholder.belongsTo(models.ValidationSet, {
            as: 'validationSet',
            foreignKey: { name: 'validationSetId', allowNull: false },
            onDelete: 'CASCADE'
        });
    };

    return validationPlaceholder;
};
