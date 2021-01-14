/**
 * The db model for a error and exception help text blocks.
 *
 * A text block is a snippet of help response to an exception or error.
 * Each help message consists of multiple of this text blocks, that are
 * randomly put together.
 *
 * @author Janick Michot
 * @date 11.01.2021
 */


module.exports = function(sequelize, DataTypes) {
    let errAndExcHelpTextBlock = sequelize.define(
        'ErrAndExcHelpTextBlock',
        {
            // the text of the current block
            text: {
                type: DataTypes.STRING,
                defaultValue: ""
            },

            // the type of the block. The response on a validation error is
            // composed as follows: <intro> + (<ref>) + <error> + <solution>
            block_type: {
                type: DataTypes.ENUM("intro", "ref", "error", "solution"),
                defaultValue: "intro"
            }
        }
    );

    errAndExcHelpTextBlock.associate = function(models) {
        errAndExcHelpTextBlock.belongsTo(models.ErrAndExcHelpException, {
            as: 'exception',
            foreignKey: { name: 'exceptionId', allowNull: true } // because not all text blocks are project specific we allow null, ie. all intro
        });
        errAndExcHelpTextBlock.belongsTo(models.ErrAndExcHelpSet, {
            as: 'set',
            foreignKey: 'setId'
        });
    };

    return errAndExcHelpTextBlock;
};
