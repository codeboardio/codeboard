/**
 * The db model for validation test sets.
 *
 * @author Janick Michot
 * @date 11.01.2021
 */


module.exports = function(sequelize, DataTypes) {
    let validationTestSet = sequelize.define(
        'ValidationTestSet',
        {
            // type of the test set
            type: {
                type: DataTypes.ENUM("compilation", "runtime", "logical"),
                defaultValue: "logical"
            },

            // the name of the test set
            name:  {
                type: DataTypes.STRING,
                defaultValue: ''
            },

            // language
            language: {
                type: DataTypes.STRING,
                defaultValue: 'Java'
            },

            // defines the input for a test
            input: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: null
            },

            // the expected output for the test
            expectedOutput: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: null
            }
        }
    );

    validationTestSet.associate = function(models) {
        validationTestSet.belongsTo(models.Project, {
            as: 'project',
            foreignKey: { name: 'projectId', allowNull: false }
        });
        validationTestSet.hasMany(models.ValidationTest, {
            as: 'testSet',
            onDelete:'CASCADE',
            foreignKey: 'validationTestSetId'
        });
        validationTestSet.hasMany(models.ValidationPlaceholder, {
            as: 'placeholderSet',
            onDelete:'CASCADE',
            foreignKey: 'validationTestSetId'
        });
    };

    return validationTestSet;
};
