/**
 * Created by hce on 16/12/19.
 *
 * The database model for help requests.
 * It stores all the files that belong to a help request.
 * It stores the user who submitted if the user is known.
 *
 * @author Janick Michot
 */


module.exports = function(sequelize, DataTypes) {
  let chatLine = sequelize.define(
    'ChatLine',
    {
      // each message has a type
      type: DataTypes.STRING,

      // chatLines message body (the message may contain html)
      message: DataTypes.TEXT,
    }
  );

  // todo wie sieht es aus mit den constraints? Damit der Chat überhaupt funktioniert, muss der User eine ID haben
  //    ==> Chat-Funktion ist nur für eingeloggte User!
  chatLine.associate = function(models) {
      chatLine.belongsTo(models.Project, {as: 'project', onDelete: 'CASCADE'});
      chatLine.belongsTo(models.User, {as: 'user', constraints: false}); // Note: disable the default constraints of belongsTo because a request might be by an anonymous user
      chatLine.belongsTo(models.User, {as: 'author', constraints: false}); // Note: disable the default constraints of belongsTo because a request might be by an anonymous user
  };

  return chatLine;
};
