/**
 * The database model for chat lines.
 *
 * @author Janick Michot
 */


module.exports = function(sequelize, DataTypes) {
  let chatLine = sequelize.define(
    'ChatLine',
    {
      // each message has a type
      type:  {
        type: DataTypes.STRING,
        defaultValue: 'text'
      },

      // chatLines message body (the message may contain html)
      message: DataTypes.TEXT('long')
    }
  );

  chatLine.associate = function(models) {
      chatLine.belongsTo(models.Project, {as: 'project', foreignKeyConstraint: true, onDelete: 'CASCADE'});
      chatLine.belongsTo(models.User, {as: 'user', constraints: false}); // Note: disable the default constraints of belongsTo because a request might be by an anonymous user
      chatLine.belongsTo(models.User, {as: 'author', constraints: false}); // Note: disable the default constraints of belongsTo because a request might be by an anonymous user
      chatLine.belongsTo(models.HelpRequest, {as: "subject", foreignKey: "subjectId", constraints: false, defaultValue: -1});
  };

  return chatLine;
};
