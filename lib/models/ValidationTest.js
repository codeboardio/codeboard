/**
 * The db model for validation tests.
 * @author Janick Michot
 * @date 11.01.2021
 */


module.exports = function(sequelize, DataTypes) {
    let validationTest = sequelize.define(
        'ValidationTest',
        {
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

            // defines the input for a test
            input: {
                type: DataTypes.STRING(256),
                allowNull: true,
                defaultValue: null
            },

            // the expected output for the test
            expectedOutput: {
                type: DataTypes.STRING(256),
                allowNull: true,
                defaultValue: null
            }
        }
    );

    validationTest.associate = function(models) {
        validationTest.belongsTo(models.ValidationTestSet, {
            as: 'validationTestSet',
            foreignKey: { name: 'validationTestSetId', allowNull: false },
            onDelete: 'CASCADE'
        });
        validationTest.hasMany(models.ValidationTextBlock, {
            as: 'textBlockSet',
            onDelete:'CASCADE',
            foreignKey: 'validationTestId'
        });
    };

    return validationTest;
};
