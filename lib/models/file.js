/**
 * Created by haches on 7/7/14.
 *
 * The ORM model for a file.
 */


module.exports = function(sequelize, DataTypes) {
  var File = sequelize.define(
    'File',
    {
      filename: DataTypes.STRING,
      path: DataTypes.STRING,
      uniqueId: DataTypes.INTEGER,
      parentUId: DataTypes.INTEGER,
      isFolder: DataTypes.BOOLEAN,
      content: {type: 'MEDIUMTEXT'},
      isHidden: {type: DataTypes.BOOLEAN, defaultValue: false}
    },
    {
      classMethods: {
        associate: function(models) {
          File.belongsTo(models.Project, {foreignKeyConstraint: true, onDelete: 'CASCADE'});
        }
      }
    }
  );

  return File;
};
