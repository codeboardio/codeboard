/**
 * Created by hce on 7/10/14.
 *
 * A collection of utility functionality that is
 * used by for the models.
 *
 * We put this in this separate file because there's
 * no simple way of adding arbitrary functions to the
 * sequelizejs models. (At least we current way we use
 * module.export in the model files).
 *
 */

var crypto = require('crypto');


var getSalt = function() {
  return crypto.randomBytes(16).toString('base64');
};

/**
 * Returns a hashed password based on the inputs.
 * @param aPassword the password in clear text
 * @param aSalt a salt that's used during the hashing
 * @return the hashed password
 * @private
 */
var getEncryptedPassword = function(aPassword, aSalt) {
  if (!aPassword || !aSalt) return '';
  return crypto.pbkdf2Sync(aPassword, aSalt, 10000, 64).toString('base64');
};

/**
 * Verifies a given password against it's hashed version.
 * @param aPasswordClearText the password in clear text
 * @param aHashedPassword the password hash
 * @param aSalt the salt that was used to hash the password
 * @return {boolean} true if the password is matched to the hashed password, otherwise false
 * @private
 */
var verifyPassword = function(aPasswordClearText, aHashedPassword, aSalt) {
  return getEncryptedPassword(aPasswordClearText, aSalt) === aHashedPassword;
};

var getRandomPassword = function() {

  // create a random number, put it base 36, cut off the last 8 characters
  // source: http://stackoverflow.com/questions/9719570/generate-random-password-string-with-requirements-in-javascript
  return Math.random().toString(36).slice(-8);
};

exports.getSalt = getSalt;
exports.getEncryptedPassword = getEncryptedPassword;
exports.verifyPassword = verifyPassword;
exports.getRandomPassword = getRandomPassword;
