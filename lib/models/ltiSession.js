/**
 * Created by hce on 9/7/14.
 *
 * Model to store session information when a request over LTI comes in.
 * An typical LTI (post) request contains information about the user_id,
 * callback url etc.
 */


module.exports = function(sequelize, DataTypes) {
  var LtiSession = sequelize.define(
    'LtiSession',
    {
      lisResultSourcedid: DataTypes.STRING,
      lisOutcomeServiceUrl: DataTypes.STRING,
      oauthNonce: DataTypes.STRING,
      oauthTimestamp: DataTypes.STRING,
      oauthConsumerKey: DataTypes.STRING,
      oauthSignatureMethod: DataTypes.STRING,
      oauthVersion: DataTypes.STRING,
      oauthSignature: DataTypes.STRING
    }
  );

    LtiSession.associate = function(models) {
        LtiSession.belongsTo(models.Project, {onDelete: 'SET NULL', onUpdate: 'CASCADE'});
        LtiSession.belongsTo(models.User);
    };

  return LtiSession;
};
