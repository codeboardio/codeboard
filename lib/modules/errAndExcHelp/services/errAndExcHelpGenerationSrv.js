/**
 * Error and Exception Help Service is used to give automatic feedback in case
 * of compilation and runtime errors/exceptions.
 *
 * @author Janick Michot
 * @date 11.01.2021
 */

'use strict';

const {Sequelize, ErrAndExcHelpTextBlock, ErrAndExcHelpException,
    ErrAndExcHelpSet, ErrAndExcHelpPlaceholder, Lang, Course} = require('../../../models');
const userSrv = require('../../../services/userSrv');
const courseSrv = require('../../../services/courseSrv');
const langSrv = require('../../../services/languageSrv');


/**
 * Returns true or false whether or not a regex expression is valid or not
 * @param regex
 * @returns {boolean}
 */
let isRegexValid = function(regex) {
    let isRegexValid = true;
    try {
        regex = new RegExp(regex);
    } catch (e) {
        isRegexValid = false;
        console.log(`Regex is not valid: ${regex}`);
    }
    return isRegexValid;
};


/**
 * Checks if a regex matches a string.
 * @param string
 * @param regex
 * @param maxStringLength
 * @returns {boolean}
 */
let isStringMatchingRegex = function(string, regex, maxStringLength = 2000) {

    if(!isRegexValid(regex)) return false;

    // we try to prevent "Maximum call stack size exceeded" by limiting the output size to 2000 characters
    // todo is this enough to prevent maxim call stack size?
    if(string.length > maxStringLength) {
        console.log(`Output ${string.length} exceeds max output length of ${maxStringLength} and will therefore not be checked with regex`);
        return false;
    }
    return new RegExp(regex).test(string);
};


/**
 * In this method, the exception that occurred is determined for an output
 * according to a set of regex expressions.
 *  Assumption: There is one entry for each exception. If not use the priority
 *
 * @param exceptionSet   ErrAndExcHelpExceptions
 * @param output
 * @returns {boolean}
 */
let findExceptionInOutput = function(exceptionSet, output) {
    let exception = false;
    exceptionSet.forEach(function(aException) {
        if(isStringMatchingRegex(output, aException.matching)) {
            if(!exception || exception.priority <= aException.priority) {
                exception = aException;
            }
        }
    });
    return exception;
};


/**
 * Method that returns a random text block within a block type.
 * For block types error and solution a exceptionId is required to return a textBlock
 * for a certain exception.
 * The individual block types can also be called via the helper methods.
 * @param set
 * @param block_type
 * @param exceptionId
 * @returns {Promise<unknown>}
 */
let getRandomTextBlock = function(set, block_type = 'intro', exceptionId = null) {
    return ErrAndExcHelpTextBlock.findOne({
        order: Sequelize.literal('rand()'),
        where: { block_type: block_type, exceptionId: exceptionId, setId: set },
        attributes: ['text'],
    })
        .then((textBlock) => {
            return (textBlock !== null) ? textBlock.text : "";
        })
        .catch(err => console.log(err));
};
let getIntroBlock = (setId) => getRandomTextBlock(setId, 'intro');
let getReferenceBlock = (setId) => getRandomTextBlock(setId, 'ref');
let getErrorBlock = (setId, exceptionId) => getRandomTextBlock(setId, 'error', exceptionId);
let getSolutionBlock = (setId, exceptionId) => getRandomTextBlock(setId, 'solution', exceptionId);

/**
 * Returns a promise that resolve to a set of exceptions for a language.
 * @param langId
 */
let getErrAndExcExceptions = function(langId) {
    return ErrAndExcHelpException.findAll({where: {langId: langId}});
};

/**
 * Returns a promise that resolve to a errAndExcHelpSet
 * @param langId
 * @param courseId
 * @returns {void|Query|Promise<Model | null>|Promise<Model>}
 */
let getErrAndExcHelpSet = function(langId, courseId) {

    // todo course relation not supported yet
     let _include = [];
    /*
    if(courseId) {
       _include = [
           { model: Course, as: "courseSet", where: { id: courseId }, attributes: [] }
       ];
    } */

    return ErrAndExcHelpSet.findOne({
        attributes: ["id"],
        where: {langId: langId},
        include: _include
    });
};

/**
 * Returns a promise that resolves to a list of placeholders by a list of ids.
 * @returns {*}
 */
let getPlaceholdersByArray = function(placeholderIds) {
    return ErrAndExcHelpPlaceholder.findAll({
        where: { id: { [Sequelize.Op.in]: placeholderIds} }
    });
};


/**
 * Takes a message and an output (run/compilation) and replaces all
 * placeholders {{i}} from the message with the values found in the
 * output by regex (received from ErrAndExcHelpPlaceholder).
 * @param msg
 * @param output
 * @returns {*}
 */
let findAndReplaceDynamicPlaceholders = function(msg, output) {

    // WARNING: The "positive lookbehind" feature may not be supported in all browsers.
    // let indexes = msg.match(/(?<={{)\d+(?=}})/g)

    // therefore this alternative
    let indexes = [];
    let match = msg.match(/{{\d+(?=}})/g);

    if(match) {
        match.forEach(el => indexes.push(parseInt(el.substring(2))));

        // get unique indexes
        indexes = [...new Set(indexes)];

        if (indexes.length > 0) {
            return getPlaceholdersByArray(indexes)
                .then(function (placeholders) {
                    let id, ph, match;
                    return msg.replace(/{{\d+}}/g, (aPlaceholder, $1) => {
                        id = parseInt(aPlaceholder.replace(/\D/g, ''));
                        ph = placeholders.find(_ph => _ph.id === id);
                        match = ph ? output.match(ph.regex) : null;
                        return match ? match[0] : aPlaceholder;
                    });
                });
        }
    }
    return msg;
};

/**
 * This function replaces static placeholder for user, course and the output
 * @param msg
 * @param output
 * @param course
 * @param user
 * @returns {*}
 */
let findAndReplaceStaticPlaceholders = function(msg, output, course, user) {
    let placeholders = {};
    placeholders.username = user ? user.username : "";
    // placeholders.coursename = course.coursename; todo not supported at the moment
    placeholders.line = output.line;
    // define more placeholders

    for (const [key, value] of Object.entries(placeholders)) {
        msg = msg.replace('{{' + key + '}}', value);
    }
    return msg;
};

/**
 * Function that takes an exception, a language and a courseId to load a set of text blocks and
 * return a random combination of these blocks as student assistance for an exception.
 * @param exception
 * @param output    output.line, output.output, output.position
 * @param lang
 * @param course
 * @param user
 * @returns {Promise}
 */
let createHelpMessageForException = function(exception, output, lang, course, user) {
    let courseId = course ? course.id : 0;
    return getErrAndExcHelpSet(lang.id, courseId)
        .then(function(aHelpSet) {
            if (!aHelpSet) return Promise.reject("Help set not found by given course and language");

            // create promises for each text block
            let promises = [
                getIntroBlock(aHelpSet.id),
                getReferenceBlock(aHelpSet.id),
                getErrorBlock(aHelpSet.id, exception.id),
                getSolutionBlock(aHelpSet.id, exception.id)
            ];

            // resolve all promises and put the message together
            return Promise.all(promises)
                .then(function(textBlocks) {
                    let msg = textBlocks.join(" ");
                    msg = findAndReplaceStaticPlaceholders(msg, output, course, user);
                    msg = findAndReplaceDynamicPlaceholders(msg, output.output);
                    return msg;
                });
        });
};


/**
 * Function that resolves a promise to return a random exception found on the first line of errors.
 * This function takes a separated output together with the lang to load all exception identifiers.
 * Within a random
 *
 * @param outputArray
 * @param lang
 * @returns {*}
 */
let getExceptionOnFirstLine = function(outputArray, lang) {
    return getErrAndExcExceptions(lang.id)
        .then(function(errAndExcExceptionsSet) {

            let errorsOnFirstLine = [];
            outputArray.forEach(function (separatedOutput, index) { // exception.line & exception.output
                if(index > 0 && separatedOutput.line !== this[index-1].line) {
                    return false;
                }
                errorsOnFirstLine.push(separatedOutput);
            }, outputArray);

            // We want to handle a random error that happens on the first line.
            // Because it is possible that not all errors are handled, we put the random selection into a while loop
            let exception, randomErrorOnFirstLine, randomIndex = null;
            let indexes = Array.from(Array(errorsOnFirstLine.length).keys());
            while(!exception && indexes.length > 0) {
                randomIndex = Math.floor(Math.random() * indexes.length); // create random index
                randomErrorOnFirstLine = errorsOnFirstLine[randomIndex];
                exception = findExceptionInOutput(errAndExcExceptionsSet, randomErrorOnFirstLine.output);
                indexes.splice(indexes.indexOf(randomIndex), 1);
            }
            return [exception, randomErrorOnFirstLine];
        });
};


/**
 * Returns a promise that is resolved to an error help message.
 * In order to create a error message this function takes the output of the compiler together with
 * additional information used for text blocks and placeholders.
 * @param output
 * @param language
 * @param userId
 *  @param courseId
 */
let getHelpForCompilationErrors = function(output, language, userId, courseId) {

    if(!output) return Promise.reject("No output is set");
    if(!language) return Promise.reject("Language is missing");

    // we want the output in form of an array
    let outputArray = Array.isArray(output) ? output : [{output: output, line: 1}]; // todo line when simple output?

    let getLang = langSrv.getLang(language);
    let getUser = userSrv.getUserById(userId);
    let getCourse = courseId ? courseSrv.getCourseById(courseId) : Promise.resolve(null);

    // resolve all promises and pass the data to the 'getErrAndExcHelp' function
    return Promise.all([getLang, getCourse, getUser])
        .then(function([lang, course, user]) {
            if(!lang) {
                return Promise.reject("Lang is required!");
            }
            // find exception
            return getExceptionOnFirstLine(outputArray, lang)
                .then(function([exception, outputObject]) {
                    return createHelpMessageForException(exception, outputObject, lang, course, user);
                });
        });
};

exports.getHelpForCompilationErrors = getHelpForCompilationErrors;
