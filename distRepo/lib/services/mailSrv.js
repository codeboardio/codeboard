/**
 * Created by hce on 06/05/15.
 *
 * This service provides functionality to
 * send official Codeboard emails.
 *
 */

var db = require('../models'),
  nodemailer = require('nodemailer'),
  Promise = require('bluebird'),
  config = require('../config/config.js');


// create reusable transport object (using default SMTP transport)

// promisify the transport and sendMail operations
var transport = Promise.promisifyAll(nodemailer.createTransport({
  service: config.email.service,
  auth: {
    user: config.email.user,
    pass: config.email.password
  }
}));

/**
 * Sends an email throught the Codeboard Email account.
 * @param {String} aFrom sender address of the email
 * @param {String} aTo receiver address of the email
 * @param {String} aSubject the email's subject
 * @param {String} aText the email's text
 * @return {Promise} a bluebird promise that resolves to function(error, info)
 */
var sendMail = function (aFrom, aTo, aSubject, aText) {
  return transport.sendMailAsync ({
    from: aFrom, to: aTo, subject: aSubject, text: aText
  });
};


/**
 * Sends the welcome email to the given user
 * @param aUsername the Codeboard username (use in the welcome message)
 * @param aUserEmail the user's email address used in the signup
 */
var sendWelcomeMail = function (aUsername, aUserEmail) {

  // template for the welcome email
  var welcomeMail = {
    from: config.email.defaultEmail,
    to: aUserEmail,
    subject: 'Welcome to Codeboard',
    text: 'Welcome ' + aUsername + ',\n\n' +
      'Thank you for signing up for Codeboard!\n\n' +
      "In case you ever forget your password, we'll use this email address to send you a new one.\n\n" +
      'Happy hacking :)\n'
  };

  // send the mail and return a promise
  return sendMail(welcomeMail.from, welcomeMail.to, welcomeMail.subject, welcomeMail.text);
};


/**
 * Sends an email with a new password
 * @param {String} aEmail the address to where to send the new password
 * @param {String} aNewPassword the new password
 * @return {Promise} promise that resolves to nodemailer values (error, info)
 */
var sendResetPasswordMail = function (aEmail, aNewPassword) {

  // template for the reset password email
  var resetMail = {
    from: config.email.defaultEmail,
    to: aEmail,
    subject: 'Password reset for Codeboard',
    text: "You're receiving this email because you requested a password reset " +
      "for your Codeboard user account.\n\n" +
    'Your new password is: ' + aNewPassword + '\n\n' +
    "After signing in you can change your password again (in the user profile settings).\n\n" +
    'Happy hacking :)\n'
  };

  // send the mail and return a promise
  return sendMail(resetMail.from, resetMail.to, resetMail.subject, resetMail.text);
};

// export the service functions
exports.sendMail = sendMail;
exports.sendWelcomeMail = sendWelcomeMail;
exports.sendResetPasswordMail = sendResetPasswordMail;
