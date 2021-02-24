/**
 * The controller for handling requests related
 * to automated help.
 *
 * @author Janick Michot
 * @date 26.01.2021
 */

'use strict';

const {ErrAndExcHelpSet, ErrAndExcHelpException, ErrAndExcHelpPlaceholder,
    ErrAndExcHelpTextBlock, User, Lang, Course} = require('../../../models');

/**
 * Creates a new help set.
 * @param title
 * @param desc
 * @param userId
 * @param langId
 */
let createHelpSet = function(title, desc, userId, langId) {
    return ErrAndExcHelpSet.create({
        title: title,
        desc: desc,
        userId: userId,
        langId: langId
    });
};

/**
 * Returns an existing help set by id.
 * @param setId
 * @param attributes
 */
let getHelpSet = function(setId, attributes = ['id', 'title', 'desc', 'userId', 'langId']) {
    return ErrAndExcHelpSet.findByPk(setId, {
        attributes: attributes
    });
};

/**
 * Returns a promise that resolve into a list with all sets.
 * @param attributes
 */
let getHelpSets = function(attributes = ['id', 'title', 'desc', 'userId', 'langId']) {
    return ErrAndExcHelpSet.findAll({
        attributes: attributes
    });
};

/**
 * Updates an help set by id.
 * @param setId
 * @param title
 * @param desc
 * @param userId
 * @param langId
 */
let updateHelpSet = function(setId, title, desc, userId, langId) {

    return getHelpSet(setId)
        .then(function(aSet) {
            if(aSet) {
                return aSet.update({
                    title: title,
                    desc: desc,
                    userId: userId,
                    langId: langId
                })
                    .then(function(up) {
                        return aSet;
                    });
            }
            return null;
        });
};

/**
 * Deletes a help set by id.
 * @param setId
 */
let deleteHelpSet = function(setId) {
    return ErrAndExcHelpSet.destroy({
        where: {
            id: setId
        }
    });
};

/**
 * Returns a promise that resolve into a bool whether or not set id is valid.
 * @param setId
 */
let isValidSetId = function(setId) {
    return ErrAndExcHelpSet.findByPk(setId)
        .then(function(set) {
            return (set !== null);
        });
};

/**
 * Creates an exception with the given data.
 * @param title
 * @param desc
 * @param matching
 * @param matching_type
 * @param phase
 * @param priority
 * @param langId
 */
let createException = function(title, desc, matching, matching_type, phase, priority, langId) {
    return ErrAndExcHelpException.create({
        title: title,
        desc: desc,
        matching: matching,
        matching_type: matching_type,
        phase: phase,
        priority: priority,
        langId: langId
    });
};

/**
 * Returns an exception by id.
 * @param exceptionId
 * @param attributes
 */
let getException = function(exceptionId, attributes = ['id', 'title', 'desc', 'matching', 'matching_type', 'phase', 'priority', 'langId']) {
    return ErrAndExcHelpException.findByPk(exceptionId, {
        attributes: attributes
    });
};

/**
 * Returns all exceptions for a given lang
 * @param attributes
 */
let getExceptions = function(attributes = ['id', 'title', 'desc', 'matching', 'matching_type', 'phase', 'priority', 'langId']) {
    return ErrAndExcHelpException.findAll({
        attributes: attributes
    });
};

/**
 * Returns all exceptions for a given lang
 * @param langId
 * @param attributes
 */
let getExceptionsByLang = function(langId, attributes = ['id', 'title', 'desc', 'matching', 'matching_type', 'phase', 'priority', 'langId']) {
    return ErrAndExcHelpException.findAll({
        where: { langId: langId },
        attributes: attributes
    });
};

/**
 * Updates an exception by its id.
 *  Assumptions:
 *   - todo the data used to update an exception is validated
 * @param exceptionId
 * @param title
 * @param desc
 * @param matching
 * @param matching_type
 * @param phase
 * @param priority
 * @param langId
 */
let updateException = function(exceptionId, title, desc, matching, matching_type, phase, priority, langId) {

    return ErrAndExcHelpException.findByPk(exceptionId)
        .then(function(aException) {
            if(aException) {
                return aException.update({
                    title: title,
                    desc: desc,
                    matching: matching,
                    matching_type: matching_type,
                    phase: phase,
                    priority: priority,
                    langId: langId
                })
                    .then(function() {
                        return aException;
                    });
            }
            return aException;
        });
};

/**
 * Returns a promise that resolves into bulk update of exceptions.
 * If an exception has already an id we update the exception. Otherwise
 * we create a new exception.
 * @param langId
 * @param exceptionSet
 * @returns {*}
 */
let bulkUpsertException = function(langId, exceptionSet) {
    let promises = [];
    exceptionSet.forEach(function(exc) {
        if(typeof exc.id !== "undefined" && exc.id > 0) {
            promises.push(updateException(exc.id, exc.title, exc.desc, exc.matching, exc.matching_type, exc.phase, exc.priority, langId));
        } else {
            promises.push(createException(exc.title, exc.desc, exc.matching, exc.matching_type, exc.phase, exc.priority, langId));

        }
    });
    return Promise.all(promises);
};

/**
 * Deletes and exception by its id.
 * @param exceptionId
 */
let deleteException = function(exceptionId) {
    return ErrAndExcHelpException.destroy({
        where: { id: exceptionId }
    });
};

/**
 * Returns a promise that resolve into a bool whether or not exception id is valid.
 * @param exceptionId
 */
let isValidExceptionId = function(exceptionId) {
    return ErrAndExcHelpException.findByPk(exceptionId)
        .then(function(exception) {
            return (exception !== null);
        });
};

/**
 * Returns a promise that resolves into a bool whether or not a exception
 * belongs into a lang or not.
 * @param langId
 * @param exceptionId
 */
let isExceptionInLang = function(langId, exceptionId) {
    return ErrAndExcHelpException.count({
        where: { id: exceptionId, langId: langId}
    })
        .then(function(numExceptions) {
            return numExceptions > 0;
        });
};


/**
 * Returns a promise that resolves into creating a placeholder.
 * @param title
 * @param desc
 * @param regex
 * @param langId
 */
let createPlaceholder = function(title, desc, regex, langId) {
    return ErrAndExcHelpPlaceholder.create({
        title: title,
        desc: desc,
        regex: regex,
        langId: langId
    });
};

/**
 * Returns a promise that resolves into a placeholder by a given id.
 * @param placeholderId
 * @param attributes
 */
let getPlaceholder = function(placeholderId, attributes = ['id', 'title', 'desc', 'regex', 'langId']) {
    return ErrAndExcHelpPlaceholder.findByPk(placeholderId, {
        attributes: attributes
    });
};

/**
 * Returns a promise that resolves into a list of placeholder by lang.
 * @param langId
 * @param attributes
 */
let getPlaceholdersByLang = function(langId, attributes = ['id', 'title', 'desc', 'regex', 'langId']) {
    return ErrAndExcHelpPlaceholder.findAll({
        where: { langId: langId },
        attributes: attributes
    });
};

/**
 * Returns a promise that resolve into an update of a placeholder by a given id.
 * @param placeholderId
 * @param title
 * @param desc
 * @param regex
 * @param langId
 */
let updatePlaceholder = function(placeholderId, title, desc, regex, langId) {
    return getPlaceholder(placeholderId)
        .then(function(aPlaceholder) {
            if(aPlaceholder) {
                return aPlaceholder.update({
                    title: title,
                    desc: desc,
                    regex: regex,
                    langId: langId
                })
                    .then(function() {
                        return aPlaceholder;
                    });
            }
            return null;
        });
};

/**
 * Returns a promise that resolves into bulk update of placeholders.
 * If a placeholder has already an id we update the exception. Otherwise
 * we create a new placeholder.
 *  Assumption:
 *   - todo The data used to bulk insert exceptions is validated before
 * @param langId
 * @param placeholderSet
 * @returns {*}
 */
let bulkUpsertPlaceholders = function(langId, placeholderSet) {
    let promises = [];
    placeholderSet.forEach(function(ph) {
        if(typeof ph.id !== "undefined" && ph.id > 0) {
            promises.push(updatePlaceholder(ph.id, ph.title, ph.desc, ph.regex, langId));
        } else {
            promises.push(createPlaceholder(ph.title, ph.desc, ph.regex, langId));

        }
    });
    return Promise.all(promises);
};

/**
 * Returns a promise that resolves into the deletion of a placeholder by its id.
 * @param placeholderId
 */
let deletePlaceholder = function(placeholderId) {
    return ErrAndExcHelpPlaceholder.destroy({
        where: { id: placeholderId }
    });
};

/**
 * Returns a promise that resolve into a bool whether or not placeholder id is valid.
 * @param placeholderId
 */
let isValidPlaceholderId = function(placeholderId) {
    return ErrAndExcHelpPlaceholder.findByPk(placeholderId)
        .then(function(placeholder) {
            return (placeholder !== null);
        });
};

/**
 * Returns a promise that resolves into a bool whether or not a placeholder
 * belongs into a lang or not.
 * @param langId
 * @param placeholderId
 */
let isPlaceholderInLang = function(langId, placeholderId) {
    return ErrAndExcHelpPlaceholder.count({
        where: { id: placeholderId, langId: langId}
    })
        .then(function(numPlaceholders) {
            return numPlaceholders > 0;
        });
};

/**
 * Returns a promise that resolve into creating a text block with the given data.
 *  Assumptions:
 *   - the data is validated
 * @param setId
 * @param text
 * @param block_type
 * @param exceptionId
 */
let createTextBlock = function(setId, text, block_type, exceptionId = null) {
    console.log(setId);
    return ErrAndExcHelpTextBlock.create({
        setId: setId,
        text: text,
        block_type: block_type,
        exceptionId: exceptionId
    });
};

/**
 * Returns promise that resolve into a text block by id.
 * @param textBlockId
 * @param attributes
 */
let getTextBlock = function(textBlockId, attributes = ['id', 'setId', 'text', 'block_type', 'exceptionId']) {
    return ErrAndExcHelpTextBlock.findByPk(textBlockId, {
        attributes: attributes
    });
};

/**
 * Returns a promise that resolve into a set of text block by set.
 * @param setId
 * @param attributes
 */
let getTextBlocksBySetId = function(setId, attributes = ['id', 'setId', 'text', 'block_type', 'exceptionId']) {
    return ErrAndExcHelpTextBlock.findAll({
        where: { setId: setId },
        attributes: attributes
    });
};

/**
 * Returns a promise that resolve into a bool whether or not text block id is valid.
 * @param textBlockId
 */
let isValidTextBlockId = function(textBlockId) {
    return ErrAndExcHelpException.findByPk(textBlockId)
        .then(function(textBlock) {
            return (textBlock !== null);
        });
};

/**
 * Returns a promise that resolves into a bool whether or not a text
 * block belongs into a set or not.
 * @param setId
 * @param textBlockId
 */
let isTextBlockInSet = function(setId, textBlockId) {
    return ErrAndExcHelpTextBlock.count({
        where: { id: textBlockId, setId: setId}
    })
        .then(function(numTextBlocks) {
            return numTextBlocks > 0;
        });
};

/**
 * Returns a promise that resolve into a update of a text block with the given data by id.
 *  Assumptions:
 *   - Data is valid
 * @param textBlockId
 * @param setId
 * @param text
 * @param block_type
 * @param exceptionId
 */
let updateTextBlock = function(textBlockId, setId, text, block_type, exceptionId = null) {
    return getTextBlock(textBlockId)
        .then(function(aTextBlock) {
            if(aTextBlock) {
                return aTextBlock.update({
                    setId: setId,
                    text: text,
                    block_type: block_type,
                    exceptionId: exceptionId
                })
                    .then(function() {
                        return aTextBlock;
                    });
            }
            return null;
        });
};

/**
 * Returns a promise that resolves into bulk update of placeholders.
 * If a placeholder has already an id we update the exception. Otherwise
 * we create a new placeholder.
 *  Assumption:
 *   - todo The data used to bulk insert text blocks is validated before
 * @returns {*}
 * @param textBlockSet
 */
let bulkUpsertTextBlocks = function(textBlockSet) {
    let promises = [];
    textBlockSet.forEach(function(tb) {
        if(typeof tb.id !== "undefined" && tb.id > 0) {
            promises.push(updateTextBlock(tb.id, tb.setId, tb.text, tb.block_type, tb.exceptionId));
        } else {
            promises.push(createTextBlock(tb.setId, tb.text, tb.block_type, tb.exceptionId));

        }
    });
    return Promise.all(promises);
};

/**
 * Returns a primise that resolves into the deletion a text block by id.
 * @param textBlockId
 */
let deleteTextBlock = function(textBlockId) {
    return ErrAndExcHelpTextBlock.destroy({
        where: { id: textBlockId }
    });
};


module.exports.createHelpSet = createHelpSet;
module.exports.getHelpSet = getHelpSet;
module.exports.getHelpSets = getHelpSets;
module.exports.updateHelpSet = updateHelpSet;
module.exports.deleteHelpSet = deleteHelpSet;
module.exports.isValidSetId = isValidSetId;

module.exports.createException = createException;
module.exports.getException = getException;
module.exports.getExceptions = getExceptions;
module.exports.getExceptionsByLang = getExceptionsByLang;
module.exports.updateException = updateException;
module.exports.bulkUpsertException = bulkUpsertException;
module.exports.deleteException = deleteException;
module.exports.isValidExceptionId = isValidExceptionId;
module.exports.isExceptionInLang = isExceptionInLang;

module.exports.createPlaceholder = createPlaceholder;
module.exports.getPlaceholder = getPlaceholder;
module.exports.getPlaceholdersByLang = getPlaceholdersByLang;
module.exports.updatePlaceholder = updatePlaceholder;
module.exports.bulkUpsertPlaceholders = bulkUpsertPlaceholders;
module.exports.deletePlaceholder = deletePlaceholder;
module.exports.isValidPlaceholderId = isValidPlaceholderId;
module.exports.isPlaceholderInLang = isPlaceholderInLang;

module.exports.createTextBlock = createTextBlock;
module.exports.updateTextBlock = updateTextBlock;
module.exports.bulkUpsertTextBlocks = bulkUpsertTextBlocks;
module.exports.deleteTextBlock = deleteTextBlock;
module.exports.getTextBlock = getTextBlock;
module.exports.getTextBlocksBySetId = getTextBlocksBySetId;
module.exports.isValidTextBlockId = isValidTextBlockId;
module.exports.isTextBlockInSet= isTextBlockInSet;



