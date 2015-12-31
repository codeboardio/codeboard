/**
 * Created by haches on 7/25/14.
 *
 * The ORM model for templates of projects.
 */


module.exports = function(sequelize, DataTypes) {

  var templateProject = sequelize.define(
    'TemplateProject',
    {
      // the programming language
      language: DataTypes.STRING
    },
    {
      classMethods: {
        associate: function(models) {
          templateProject.hasMany(models.TemplateFile, {as: 'fileSet'});
        }
      }
    }
  );

  return templateProject;
};