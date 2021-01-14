/**
 * Error and Exception Help Service is used to give automatic feedback in case
 * of compilation and runtime errors/exceptions.
 *
 * @author Janick Michot
 * @date 11.01.2021
 */

'use strict';

const {Sequelize, ErrAndExcHelpTextBlock, ErrAndExcHelpException,
    ErrAndExcHelpSet, ErrAndExcHelpPlaceholder, Lang, Course} = require('../models');


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
 * Output Test Regex
 * Check output using Regular Expressions to match against the student's output.
 * @param output
 * @param regex
 * @param maxOutputLength
 * @returns {boolean}
 */
let checkOutputRegex = function(output, regex, maxOutputLength = 2000) {

    if(!isRegexValid(regex)) return false;

    // we try to prevent "Maximum call stack size exceeded" by limiting the output size to 2000 characters
    // todo is this enough to prevent maxim call stack size?
    if(output.length > maxOutputLength) {
        console.log(`Output ${output.length} exceeds max output length of ${maxOutputLength} and will therefore not be checked with regex`);
        return false;
    }
    return new RegExp(regex).test(output);
};


/**
 * In this method, the exception that occurred is determined for an output
 * according to a set of regex expressions.
 * @param exceptionSet   ErrAndExcHelpExceptions
 * @param output
 * @returns {boolean}
 */
let findExceptionInOutput = function(exceptionSet, output) {
    let exception = false;
    exceptionSet.forEach(function(aException) {
        if(exception) return;
        if(checkOutputRegex(output, aException.matching)) {
            exception = aException;
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
            return (textBlock !== null) ? textBlock.text : false;
        })
        .catch(err => console.log(err));
};
let getIntroBlock = (setId) => getRandomTextBlock(setId, 'intro');
let getReferenceBlock = (setId) => getRandomTextBlock(setId, 'ref');
let getErrorBlock = (setId, exceptionId) => getRandomTextBlock(setId, 'error', exceptionId);
let getSolutionBlock = (setId, exceptionId) => getRandomTextBlock(setId, 'solution', exceptionId);


/**
 * Returns all exceptions for a language.
 * @param lang
 */
let getExceptionsByLanguage = function(lang = "Java") {
    return ErrAndExcHelpException.findAll({
        includes: [{model: Lang, as: 'lang', where: { name: lang }, attributes: []}]
    });
};


/**
 * Returns a error and exception help set by lang and courseId
 * todo default set per language?
 * @param lang
 * @param courseId
 * @returns {void|Query|Promise<Model | null>|Promise<Model>}
 */
let getErrAndExcHelpSet = function(lang, courseId = 1) {
    return ErrAndExcHelpSet.findOne({
        attributes: ["id"],
        include: [
            { model: Course, as: "courseSet", where: { id: courseId }, attributes: [] },
            { model: Lang, as: "lang", where: { name: lang }, attributes: [] }
        ]
    });
};


/**
 * Returns all placeholders within an array.
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
let repPlaceholdersByOutputValues = function(msg, output) {

    // WARNING: The "positive lookbehind" feature may not be supported in all browsers.
    // let indexes = msg.match(/(?<={{)\d+(?=}})/g)

    // therefore this alternative
    let indexes = [];
    msg.match(/{{\d+(?=}})/g).forEach(el => indexes.push(parseInt(el.substring(2))));

    // get unique indexes
    indexes = [...new Set(indexes)];

    return getPlaceholdersByArray(indexes)
        .then(function(placeholders) {
            let id, ph, value;
            return msg.replace(/{{\d+}}/g, (match, $1) => {
                value = null;
                id = parseInt(match.replace(/\D/g,''));
                ph = placeholders.find(_ph => _ph.id === id);
                value = ph ? output.match(ph.regex)[0] : null;
                return (value) ? value : match;
            });
        });
};




/**
 * todo bezieht sich im Moment auf lang und courseId
 *  besser wenn diese Werte übergeben werden müssen
 *  im Moment kann ein Kurs nur ein Set haben. Wie wäre es mit einer Zwischentabelle?
 *      ErrAndExcHelpSetCourse
 *      id | phase | courseId, errAndExcHelpSetId
 *
 * @param data
 * @param output
 */
let getHelpForOutput = function(output, data) {
// let getHelpForOutput = function(output, language, courseId) {

    const language = data.language;
    const courseId = data.courseId;

    // get all exceptions for the current language
    return getExceptionsByLanguage(language)
        .then(function(exceptionSet) {

            // find the matching exception by checking the output with the regex expressions
            let exception = findExceptionInOutput(exceptionSet, output);

            // find help set and load text blocks
            return getErrAndExcHelpSet(language, courseId)
                .then(function(aHelpSet) {
                    if(!aHelpSet) return false;

                    let promises = [];
                    promises.push(getIntroBlock(aHelpSet.id));
                    promises.push(getReferenceBlock(aHelpSet.id));

                    if(exception) {
                        promises.push(getErrorBlock(aHelpSet.id, exception.id));
                        promises.push(getSolutionBlock(aHelpSet.id, exception.id));
                    }

                    // after loading all text blocks we replace placeholder in the merged message
                    return Promise.all(promises)
                        .then(msgBlocks => repPlaceholdersByOutputValues(msgBlocks.join(" "), output));
                });
        })
        .catch(function(err) {
            console.log(err);
        });
};

exports.getHelpForOutput = getHelpForOutput;
