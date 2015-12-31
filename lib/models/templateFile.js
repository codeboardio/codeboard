/**
 * Created by haches on 7/25/14.
 *
 * The ORM model for templates of files.
 * This is used by the templates of projects.
 *
 */

module.exports = function(sequelize, DataTypes) {

  var templateFile = sequelize.define(
    'TemplateFile',
    {
      // name of the file
      filename: DataTypes.STRING,

      // the relative path of the file (without the filename)
      path: DataTypes.STRING,

      // an id that is unique to this file within the scope of the project
      uniqueId: DataTypes.INTEGER,

      // the id of the parent folder (-1 if it's the root folder)
      parentUId: DataTypes.INTEGER,

      // boolean value
      isFolder: DataTypes.BOOLEAN,

      // the content of the file
      content: DataTypes.TEXT,

      // true if the file is hidden from users and only visible to owners of the project
      isHidden: DataTypes.BOOLEAN
    }
  );

  return templateFile;
};
