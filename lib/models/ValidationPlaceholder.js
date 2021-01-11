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
            // the slug is used to make a reference to this placeholder. "Wie es scheint, hast du das Zeichen {{char}} vergessen"
            slug: {
                type: DataTypes.STRING(32),
                defaultValue: "",
                unique: true
            },

            // regex with which the corresponding value can be determined.
            regex:  {
                type: DataTypes.STRING(32),
                defaultValue: ''
            },
        }
    );

    validationPlaceholder.associate = function(models) {
        validationPlaceholder.belongsTo(models.ValidationTestSet, {
            as: 'validationTestSet',
            foreignKey: { name: 'validationTestSetId', allowNull: true }, // todo does it make sense to use placeholders without belonging to a test?
            onDelete: 'CASCADE'
        });
    };

    return validationPlaceholder;
};
