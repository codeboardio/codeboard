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
            blockText: {
                type: DataTypes.STRING,
                defaultValue: ""
            },

            // the type of the block. The response on a validation error is
            // composed as follows: <intro> + (<ref>) + <error> + <solution>
            blockType: {
                type: DataTypes.ENUM("intro", "ref", "error", "solution"),
                defaultValue: "intro"
            }
        }
    );

    validationTextBlock.associate = function(models) {
        validationTextBlock.belongsTo(models.ValidationTest, {
            as: 'validationTest',
            foreignKey: { name: 'validationTestId', allowNull: false } // because not all text blocks are project specific we allow null, ie. all intro
        });
    };

    return validationTextBlock;
};
