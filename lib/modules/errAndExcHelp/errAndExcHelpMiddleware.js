'use strict';

const errAndExcHelpSrv = require('./services/errAndHelpSrv');
const { Lang } = require('../../models');

/**
 * Checks if the given lang id is valid.
 */
let _isValidLangId = function(req, res, next, langId) {
    if(!langId) {
        res.status(404).json({ msg: "Language not set" });
    } else {
        Lang.findByPk(langId)
            .then(function (lang) {
                if (lang) {
                    next();
                } else {
                    res.status(404).json({msg: "Language with id " + langId + " not found"});
                }
            });
    }
};

/**
 * Checks if the given lang id is valid.
 */
let isValidLangId = function(req, res, next) {
    const langId = req.params.langId;
    _isValidLangId(req, res, next, langId);
};

/**
 * Checks if the given set id is valid.
 */
let _isValidSetId = function(req, res, next, setId) {
    if(!setId) {
        res.status(404).json({ msg: "SetId is not set" });
    } else {
        errAndExcHelpSrv.isValidSetId(setId)
            .then(function (isValid) {
                if (isValid) {
                    next();
                } else {
                    res.status(404).json({msg: "Set with id " + setId + " not found."});
                }
            });
    }
};
/**
 * Checks if the given set id is valid.
 */
let isValidSetId = function(req, res, next) {
    const setId = req.params.setId;
    _isValidSetId(req, res, next, setId);
};

/**
 * Checks if the given placeholder id is valid.
 */
let isValidPlaceholderId = function(req, res, next) {

    const placeholderId = req.params.placeholderId;

    errAndExcHelpSrv.isValidPlaceholderId(placeholderId)
        .then(function(isValid) {
            if(isValid) {
                next();
            } else {
                res.status(404).json({ msg: "Placeholder with id " + placeholderId + " not found."});
            }
        });
};

/**
 * Checks if the given exception id is valid.
 */
let isValidExceptionId = function(req, res, next) {

    const exceptionId = req.params.setId;

    errAndExcHelpSrv.isValidExceptionId(exceptionId)
        .then(function(isValid) {
            if(isValid) {
                next();
            } else {
                res.status(404).json({ msg: "Exception with id " + exceptionId + " not found."});
            }
        });
};

/**
 * Checks if the given text block id is valid.
 */
let isValidTextBlockId = function(req, res, next) {

    const textBlockId = req.params.textBlockId;

    errAndExcHelpSrv.isValidTextBlockId(textBlockId)
        .then(function(isValid) {
            if(isValid) {
                next();
            } else {
                res.status(404).json({ msg: "Text Block with id " + textBlockId + " not found."});
            }
        });
};

/**
 * Checks if the given text block id belongs to a given set id.
 */
let isTextBlockInSet = function(req, res, next) {

    const textBlockId = req.params.textBlockId;
    const setId = req.params.setId;

    errAndExcHelpSrv.isTextBlockInSet(setId, textBlockId)
        .then(function(isInSet) {
            if(isInSet) {
                next();
            } else {
                res.status(404).json({ msg: "Text Block with id " + textBlockId + " is not in set with id " + setId + " found."});
            }
        });
};

/**
 * Checks if the given exception id  belongs to a given lang id.
 */
let isExceptionInLang = function(req, res, next) {

    const exceptionId = req.params.exceptionId;
    const langId = req.params.langId;

    errAndExcHelpSrv.isExceptionInLang(langId, exceptionId)
        .then(function(isExceptionInLand) {
            if(isExceptionInLand) {
                next();
            } else {
                res.status(404).json({ msg: "Exception with id " + exceptionId + " is not in lang with id " + langId + " found."});
            }
        });
};

/**
 * Checks if the given placeholder id  belongs to a given lang id.
 */
let isPlaceholderInLang = function(req, res, next) {

    const placeholderId = req.params.placeholderId;
    const langId = req.params.langId;

    errAndExcHelpSrv.isExceptionInLang(langId, placeholderId)
        .then(function(isExceptionInLand) {
            if(isExceptionInLand) {
                next();
            } else {
                res.send(404).json({ msg: "Placeholder with id " + placeholderId + " is not in lang with id " + langId + " found."});
            }
        });
};

/**
 * Checks if the given data for a set is valid.
 * Used to validate both add and update.
 */
let isSetDataValid = function(req, res, next) {

    req.body.setId = req.body.setId || 0;
    req.body.title = req.body.title || '';
    req.body.desc = req.body.desc || '';
    req.body.userId = req.body.userId || 0;

    _isValidLangId(req, res, next, req.body.langId);
};

/**
 * Checks if the given data for an exception is valid.
 * Used to validate both add and update.
 */
let isExceptionDataValid = function(req, res, next) {

    req.body.title = req.body.title || '';
    req.body.desc = req.body.desc || '';
    req.body.matching = req.body.matching || '';
    req.body.matching_type = req.body.matching_type || 'regex';
    req.body.phase = req.body.phase || 'intro';
    req.body.priority = req.body.priority || 1;

    _isValidLangId(req, res, next, req.body.langId);
};

/**
 * Checks if the given data for an placeholder is valid.
 * Used to validate both add and update.
 */
let isPlaceholderDataValid = function(req, res, next) {

    req.body.title = req.body.title || '';
    req.body.desc = req.body.desc || '';
    req.body.regex = req.body.regex || '';

    _isValidLangId(req, res, next, req.body.langId);
};

/**
 * Checks if the given data for an text block is valid.
 * Used to validate both add and update.
 */
let isTextBlockDataValid = function(req, res, next) {

    req.body.text = req.body.text || '';
    req.body.block_type = req.body.block_type || 'regex';
    req.body.exceptionId = req.body.exceptionId || null;

    next();
};

/**
 * Checks if the given bulk data for a exceptions is valid.
 */
let isExceptionBulkDataValid = function(req, res, next) {

    if(Object.keys(req.body).length > 0) {
        req.body.forEach(function (exception) {
            exception.title = exception.title || '';
            exception.desc = exception.desc || '';
            exception.matching = exception.matching || '';
            exception.matching_type = exception.matching_type || 'regex';
            exception.phase = exception.phase || 'intro';
            exception.priority = exception.priority || 1;
        });
    } else {
        req.body = [];
    }
    next();
};

/**
 * Checks if the given bulk data for a placeholders is valid.
 */
let isPlaceholderBulkDataValid = function(req, res, next) {
    if(Object.keys(req.body).length > 0) {
        req.body.forEach(function (placeholder) {
            placeholder.title = placeholder.title || '';
            placeholder.desc = placeholder.desc || '';
            placeholder.regex = placeholder.regex || '';
        });
    } else {
        req.body = [];
    }
    next();
};

/**
 * Checks if the given bulk data for a text blocks is valid.
 */
let isTextBlockBulkDataValid = function(req, res, next) {
    if(Object.keys(req.body).length > 0) {
        req.body.forEach(function (textBlock) {
            textBlock.text = textBlock.text || '';
            textBlock.block_type = textBlock.block_type || 'regex';
            textBlock.exceptionId = textBlock.exceptionId || null;
        });
    } else {
        req.body = [];
    }
    next();
};


module.exports.isValidLangId = isValidLangId;
module.exports.isValidSetId = isValidSetId;
module.exports.isValidPlaceholderId = isValidPlaceholderId;
module.exports.isValidExceptionId = isValidExceptionId;
module.exports.isValidTextBlockId = isValidTextBlockId;
module.exports.isTextBlockInSet = isTextBlockInSet;
module.exports.isExceptionInLang = isExceptionInLang;
module.exports.isPlaceholderInLang = isPlaceholderInLang;
module.exports.isSetDataValid = isSetDataValid;
module.exports.isExceptionDataValid = isExceptionDataValid;
module.exports.isPlaceholderDataValid = isPlaceholderDataValid;
module.exports.isTextBlockDataValid = isTextBlockDataValid;
module.exports.isExceptionBulkDataValid = isExceptionBulkDataValid;
module.exports.isPlaceholderBulkDataValid = isPlaceholderBulkDataValid;
module.exports.isTextBlockBulkDataValid = isTextBlockBulkDataValid;
