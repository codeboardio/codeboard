/**
 * Created by hce on 06/05/15.
 * Updated by mict 20/03/20
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
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail'
}));

/**
 * Sends an email throught the Codeboard Email account.
 * @param {String} aFrom sender address of the email
 * @param {String} aTo receiver address of the email
 * @param {String} aSubject the email's subject
 * @param {String} aText the email's text
 * @return {Promise} a bluebird promise that resolves to function(error, info)
 */
let sendMail = function (aFrom, aTo, aSubject, aText) {
    return transport.sendMailAsync ({
        from: aFrom, to: aTo, subject: aSubject, text: aText
    });
};


/**
 * This mail is sent when the teacher writes something in the chat
 * @returns {Promise}
 */
let sendTeacherAddedAnswerMail = function(email, name, projectName) {

    let teacherAddedAnswerMail = {
        from: 'noreply@codeboard.sml.zhaw.ch "Codeboard"',
        to: email,
        subject: 'Frage zur Aufgabe ' + projectName,
        text: 'Hallo '+ name + '\n\n' +
            'Deine Frage wurde beantwortet. Du findest die Antwort unterhalb deiner Frage.\n' +
            'Wenn du weitere Fragen hast, kannst du diese auf dem gleichen Weg stellen.\n\n' +
            'Gruss\n' +
            'Codeboard\n\n' +
            '--------------------------------------------------\n' +
            'Dies ist eine automatisch generierte Nachricht. Antworten auf diese E-Mail werden nicht gelesen.\n'
    };

    // send the mail and return a promise
    return sendMail(teacherAddedAnswerMail.from, teacherAddedAnswerMail.to, teacherAddedAnswerMail.subject, teacherAddedAnswerMail.text);
};



// export the service functions
exports.sendMail = sendMail;
exports.sendTeacherAddedAnswerMail = sendTeacherAddedAnswerMail;