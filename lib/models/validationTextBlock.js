/**
 * The db model for validation text blocks.
 *
 * @author Janick Michot
 * @date 11.01.2021
 */


module.exports = function(sequelize, DataTypes) {
    let validationTextBlock = sequelize.define(
        'ValidationTextBlock',
        {
            // the text of the current block
            text: {
                type: DataTypes.STRING,
                defaultValue: ""
            },

            // the type of the block. The response on a validation error is
            // composed as follows: <intro> + (<ref>) + <error> + <solution>
            type: {
                type: DataTypes.ENUM("intro", "ref", "error", "solution"),
                defaultValue: "intro"
            }
        }
    );

    validationTextBlock.associate = function(models) {
        validationTextBlock.belongsTo(models.ValidationException, {
            as: 'validationException',
            foreignKey: { name: 'validationExceptionId', allowNull: true } // because not all text blocks are project specific we allow null, ie. all intro
        });
        validationTextBlock.belongsTo(models.ValidationSet, {
            as: 'validationSet',
            foreignKey: { name: 'validationSetId', allowNull: false }
        });
    };

    return validationTextBlock;
};
