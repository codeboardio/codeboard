/**
 * The db model for a programming language.
 *
 * @author Janick Michot
 * @date 12.01.2021
 */


module.exports = function(sequelize, DataTypes) {
    return sequelize.define(
        'Lang',
        {
            // the name of the language
            name: {
                type: DataTypes.STRING(32),
                defaultValue: ""
            },

            // file extension of the source files
            filenameExtension: {
                type: DataTypes.STRING(32),
                defaultValue: ""
            },

            // external library extension of the source files
            externalLibraryExtension: {
                type: DataTypes.STRING(32),
                defaultValue: ""
            },

            // is this a static or dynamic language? e.g. Python is dynamic
            isDynamicLanguage: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },

            // the supported versions as an array using getter and setter
            ver: {
                type: DataTypes.STRING(32),
                defaultValue: '',
                get() {
                    return this.getDataValue('ver').split(';');
                },
                set(val) {
                    this.setDataValue('ver', val.join(';'));
                },
            },
        }
    );
};
