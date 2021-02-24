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
const errAndExcHelpSrv = require('../services/errAndHelpSrv');


/**
 * Creates a new help set.
 *  Assumptions:
 *   - todo The date used to create a help set is validated
 * @param req
 * @param res
 */
let createHelpSet = function(req, res) {

    const title = req.body.title;
    const desc = req.body.desc;
    const userId = req.body.userId;
    const langId = req.body.langId;

    errAndExcHelpSrv.createHelpSet(title, desc, userId, langId)
        .then(function(aSet) {
           if(aSet) {
               res.status(201).json(aSet);
           } else {
               res.status(500).send({msg: "Could not create help set"});
           }
        })
        .catch(function(err) {
            res.status(500).json({msg: "Could not create help set", err: err});
        });
};

/**
 * Returns an help set by id.
 * @param req
 * @param res
 */
let getHelpSet = function(req, res) {

    const setId = req.params.setId;

    errAndExcHelpSrv.getHelpSet(setId)
        .then(function(aSet) {
            if(aSet) {
                res.status(201).json(aSet);
            } else {
                res.status(404).json({msg: "Help Set with Id " + setId + " not found."});
            }
        })
        .catch(function(err) {
            res.status(500).json({msg: "Error loading help set with id " + setId, err: err });
        });
};

/**
 * Returns a list with all sets
 * @param req
 * @param res
 */
let getHelpSets = function(req, res) {
    errAndExcHelpSrv.getHelpSets()
        .then(function(errAndExcHelpSets) {
            if(errAndExcHelpSets) {
                res.status(201).json(errAndExcHelpSets);
            } else {
                res.status(404).json({msg: "No sets found."});
            }
        })
        .catch(function(err) {
            res.status(500).json({msg: "Error loading help sets", err: err});
        });
};

/**
 * Updates an existing help set by id.
 *  Assumption¨s:
 *   - todo The date used to create a help set is validated
 * @param req
 * @param res
 */
let updateHelpSet = function(req, res) {

    const setId = req.params.setId;
    const title = req.body.title;
    const desc = req.body.desc;
    const userId = req.body.userId;
    const langId = req.body.langId;

    errAndExcHelpSrv.updateHelpSet(setId, title, desc, userId, langId)
        .then(function(aSet) {
            if(aSet) {
                res.status(201).json(aSet);
            } else {
                res.status(500).send({msg: "Could not update update help set with id " + setId});
            }
        })
        .catch(function(err) {
            console.log(err);
            res.status(500).send({msg: "Could not update update help set with id " + setId, err: err});
        });
};

/**
 * Deletes a help set by id.
 * @param req
 * @param res
 */
let deleteHelpSet = function(req, res) {

    const setId = req.params.setId;

    errAndExcHelpSrv.deleteHelpSet(setId)
        .then(function(aSet) {
            if(aSet) {
                res.status(201).json({msg: "Exception with id " + setId + " deleted"});
            } else {
                res.status(500).send({msg: "Cloud not delete set with id " + setId});
            }
        })
        .catch(function(err) {
            res.status(500).send({msg: "Cloud not delete set with id " + setId, err: err});
        });
};


/**
 * Creates an exception with the given data.
 *  Assumptions:
 *   - todo The date used to create an exception is validated
 * @param req
 * @param res
 */
let createException = function(req, res) {

    const langId = req.params.langId;
    const title = req.body.title;
    const desc = req.body.desc;
    const matching = req.body.matching;
    const matching_type = req.body.matching_type;
    const phase = req.body.phase;
    const priority = req.body.priority;

    errAndExcHelpSrv.createException(title, desc, matching, matching_type, phase, priority, langId)
        .then(function(aException) {
            if(aException) {
                res.status(201).json(aException);
            } else {
                res.status(500).json({msg: "Could not create exception"});
            }
        })
        .catch(function(err) {
            res.status(500).json({msg: "Could not create exception", err: err});
        });
};

/**
 * Returns a exception by id.
 * @param req
 * @param res
 */
let getException = function(req, res) {

    const exceptionId = req.params.exceptionId;

    return errAndExcHelpSrv.getException(exceptionId)
        .then(function(aSet) {
            if(aSet) {
                res.status(201).json(aSet);
            } else {
                res.status(404).json({msg: "Exception with Id " + exceptionId + " not found."});
            }
        })
        .catch(function(err) {
            res.status(500).json({msg: "Error getting exception with id " + exceptionId, err: err});
        });
};

/**
 * Endpoint that returns a set of exceptions
 * @param req
 * @param res
 */
let getExceptionsByLang = function(req, res) {

    const langId = req.params.langId;

    errAndExcHelpSrv.getExceptionsByLang(langId)
        .then(function(errAndExcHelpException) {
            if(errAndExcHelpException) {
                res.status(201).json(errAndExcHelpException);
            } else {
                res.status(404).json({msg: "No exceptions found."});
            }
        })
        .catch(function(err) {
            res.status(500).json({ msg: "Error getting exceptions with langId " + langId, err: err});
        });
};

/**
 * Updates an exception by its id.
 * @param req
 * @param res
 */
let updateException = function(req, res) {

    const langId = req.params.langId;
    const exceptionId = req.params.exceptionId;
    const title = req.body.title;
    const desc = req.body.desc;
    const matching = req.body.matching;
    const matching_type = req.body.matching_type;
    const phase = req.body.phase;
    const priority = req.body.priority;

    errAndExcHelpSrv.updateException(exceptionId, title, desc, matching, matching_type, phase, priority, langId )
        .then(function(aException) {
            if(aException) {
                res.status(201).json(aException);
            } else {
                res.status(500).json({msg: "Could not update exception with id " + exceptionId});
            }
        })
        .catch(function(err) {
            res.status(500).json({msg: "Could not update exception with id " + exceptionId, err: err});
        });
};

/**
 * Endpoint that takes a set of exception and upsert the data to the db.
 * Exceptions with a given id are updated and exceptions without an id
 * are newly created.
 *  Assumption:
 *   - The data used to bulk insert exceptions is validated before
 *   - The url contains the parameter langId
 * @param req
 * @param res
 */
let bulkUpsertExceptions = function(req, res) {

    const exceptionSet = req.body;
    const langId = req.params.langId;

    errAndExcHelpSrv.bulkUpsertException(langId, exceptionSet)
        .then(function(result) {
            res.status(201).json(result);
        })
        .catch(function(err) {
            res.status(500).json({msg: "Could not bulk insert and update exceptions", err: err});
        });
};

/**
 * Deletes and exception by its id.
 * @param req
 * @param res
 */
let deleteException = function(req, res) {

    const exceptionId = req.params.exceptionId;

    errAndExcHelpSrv.deleteException(exceptionId)
        .then(function(aException) {
            if(aException) {
                res.status(201).json({msg: "Exception with id " + exceptionId + " deleted"});
            } else {
                res.status(500).json({msg: "Could not delete exception with id " + exceptionId});
            }
        })
        .catch(function (err) {
            res.status(500).json({msg: "Could not delete exception with id " + exceptionId, err: err});

        });
};

/**
 * Creates a placeholder with the given data
 *  Assumptions:
 *   - todo the data is validated
 * @param req
 * @param res
 */
let createPlaceholder = function(req, res) {

    const title = req.body.title;
    const desc = req.body.desc;
    const regex = req.body.regex;
    const langId = req.body.langId;

    errAndExcHelpSrv.createPlaceholder(title, desc, regex, langId)
        .then(function(aPlaceholder) {
            if(aPlaceholder) {
                res.status(201).json(aPlaceholder);
            } else {
                res.status(500).send({msg: "Could not create placeholder"});
            }
        })
        .catch(function(err) {
            res.status(500).send({ msg: "Could not create placeholder", err: err });
        });
};

/**
 * Returns a placeholder by given id.
 * @param req
 * @param res
 */
let getPlaceholder = function(req, res) {

    const placeholderId = req.params.placeholderId;

    errAndExcHelpSrv.getPlaceholder(placeholderId)
        .then(function(aPlaceholder) {
            if(aPlaceholder) {
                res.status(201).json(aPlaceholder);
            } else {
                res.status(404).json({ msg: "Placeholder with Id " + placeholderId + " not found." });
            }
        })
        .catch(function(err) {
            res.status(500).json({ msg: "Error getting placeholder with id " + placeholderId, err: err });
        });
};

/**
 * Returns a list of placeholder by lang.
 * @param req
 * @param res
 */
let getPlaceholders = function(req, res) {

    const langId = req.params.langId;

    errAndExcHelpSrv.getPlaceholdersByLang(langId)
        .then(function(errAndExcHelpPlaceholders) {
            if(errAndExcHelpPlaceholders) {
                res.status(201).json(errAndExcHelpPlaceholders);
            } else {
                res.status(404).json({msg: "No placeholders found."});
            }
        })
        .catch(function(err) {
            res.status(500).json({ msg: "Error loading placeholders by langId " + langId, err: err});
        });
};

/**
 * Updates an placeholder by id with the given data.
 *  Assumption:
 *   - todo The data used to create the placeholder is validated
 * @param req
 * @param res
 */
let updatePlaceholder = function(req, res) {

    console.log(req.params);

    const placeholderId = req.params.placeholderId;
    const langId = req.params.langId;
    const title = req.body.title;
    const desc = req.body.desc;
    const regex = req.body.regex;

    errAndExcHelpSrv.updatePlaceholder(placeholderId, title, desc, regex, langId)
        .then(function(aPlaceholder) {
            if(aPlaceholder) {
                res.status(201).json(aPlaceholder);
            } else {
                res.status(500).json({msg: "Could not update placeholder with id " + placeholderId});
            }
        })
        .catch(function(err) {
            res.status(500).json({msg: "Could not update placeholder with id " + placeholderId, err: err});
        });
};

/**
 * Bulk insert or update placeholders.
 * Placeholders with a given id are updated and placeholders without an id
 * are newly created.
 *  Assumption:
 *   - The data used to bulk insert placeholders is validated before
 *   - The url contains the parameter
 * @param req
 * @param res
 */
let bulkUpsertPlaceholders = function(req, res) {

    const exceptionSet = req.body;
    const langId = req.params.langId;

    errAndExcHelpSrv.bulkUpsertPlaceholders(langId, exceptionSet)
        .then(function(result) {
            res.status(201).json(result);
        })
        .catch(function(err) {
            res.status(500).json({msg: "Could not bulk insert and update placeholders", err: err});
        });
};

/**
 * Deletes a placeholder by its id.
 * @param req
 * @param res
 */
let deletePlaceholder = function(req, res) {

    const placeholderId = req.params.placeholderId;

    errAndExcHelpSrv.deletePlaceholder(placeholderId)
        .then(function(aPlaceholder) {
            if(aPlaceholder) {
                res.status(201).json({msg: "Placeholder with id " + placeholderId + " deleted"});
            } else {
                res.status(500).json({msg: "Could not delete placeholder with id " + placeholderId});
            }
        })
        .catch(function (err) {
            res.status(500).json({msg: "Could not delete placeholder with id " + placeholderId, err: err});

        });
};


/**
 * Creates a text block with the given data.
 *  Assumptions:
 *   - todo the data is valid
 * @param req
 * @param res
 */
let createTextBlock = function(req, res) {

    const setId = req.params.setId;
    const text = req.body.text;
    const block_type = req.body.block_type;
    const exceptionId = req.body.exceptionId;

    errAndExcHelpSrv.createTextBlock(setId, text, block_type, exceptionId)
        .then(function(aTextBlock) {
            if(aTextBlock) {
                res.status(201).json(aTextBlock);
            } else {
                res.status(500).send({msg: "Could not create text block."});
            }
        })
        .catch(function(err) {
            res.status(500).send({msg: "Could not create text block.", err: err});
        });
};

/**
 * Updates a text block with the given data by id.
 *  Assumptions:
 *   - todo the data is valid
 * @param req
 * @param res
 */
let updateTextBlock = function(req, res) {

    const textBlockId = req.params.textBlockId;
    const setId = req.params.setId;
    const text = req.body.text;
    const block_type = req.body.block_type;
    const exceptionId = req.body.exceptionId;

    errAndExcHelpSrv.updateTextBlock(textBlockId, setId, text, block_type, exceptionId)
        .then(function(aTextBlock) {
            if(aTextBlock) {
                res.status(201).json(aTextBlock);
            } else {
                res.status(500).json({msg: "Could not update text block with id " + textBlockId});
            }
        })
        .catch(function(err) {
            res.status(500).json({msg: "Could not update text block with id " + textBlockId, err: err});
        });
};

/**
 * Bulk insert or update text blocks.
 * Text blocks with a given id are updated and placeholders without an id
 * are newly created.
 *  Assumption:
 *   - todo the data is validated
 * @param req
 * @param res
 */
let bulkUpsertTextBlocks = function(req, res) {

    const textBlockSet = req.body;

    errAndExcHelpSrv.bulkUpsertTextBlocks(textBlockSet)
        .then(function(result) {
            res.status(201).json(result);
        })
        .catch(function(err) {
            res.status(500).json({msg: "Could not bulk insert and update text blocks", err: err});
        });
};

/**
 * Deletes a text block by id.
 * @param req
 * @param res
 */
let deleteTextBlock = function(req, res) {

    const textBlockId = req.params.textBlockId;

    errAndExcHelpSrv.deleteTextBlock(textBlockId)
        .then(function(aTextBlock) {
            if(aTextBlock) {
                res.status(201).json({msg: "Text block with id " + textBlockId + " deleted"});
            } else {
                res.status(500).json({msg: "Cloud not delete text block with id " + textBlockId});
            }
        })
        .catch(function(err) {
            res.status(500).json({msg: "Cloud not delete text block with id " + textBlockId, err: err});
        });
};

/**
 * Returns a text block by id.
 * @param req
 * @param res
 */
let getTextBlock = function(req, res) {

    const textBlockId = req.params.textBlockId;

    errAndExcHelpSrv.getTextBlock(textBlockId)
        .then(function(aTextBlock) {
            if(aTextBlock) {
                res.status(201).json(aTextBlock);
            } else {
                res.status(404).json({msg: "Text block with Id " + textBlockId + " not found."});
            }
        })
        .catch(function(err) {
            res.status(500).json({ msg: "Error loading text block with id " + textBlockId, err: err });
        });
};


/**
 * Endpoint that returns a set of text blocks by help set id.
 * @param req
 * @param res
 */
let getTextBlocks = function(req, res) {

    const setId = req.params.setId;

    errAndExcHelpSrv.getTextBlocksBySetId(setId)
        .then(function(errAndExcHelpTextBlock) {
            if(errAndExcHelpTextBlock) {
                res.status(201).json(errAndExcHelpTextBlock);
            } else {
                res.status(404).json({msg: "No text blocks found."});
            }
        })
        .catch(function(err) {
            res.status(500).json({ msg: "Error loading text block by setId " + setId, err: err});
        });
};


module.exports.createHelpSet = createHelpSet;
module.exports.createException = createException;
module.exports.createPlaceholder = createPlaceholder;
module.exports.createTextBlock = createTextBlock;
module.exports.updateHelpSet = updateHelpSet;
module.exports.updateException = updateException;
module.exports.updatePlaceholder = updatePlaceholder;
module.exports.updateTextBlock = updateTextBlock;
module.exports.bulkUpsertExceptions = bulkUpsertExceptions;
module.exports.bulkUpsertPlaceholders = bulkUpsertPlaceholders;
module.exports.bulkUpsertTextBlocks = bulkUpsertTextBlocks;
module.exports.deletePlaceholder = deletePlaceholder;
module.exports.deleteTextBlock = deleteTextBlock;
module.exports.deleteHelpSet = deleteHelpSet;
module.exports.deleteException = deleteException;
module.exports.getPlaceholder = getPlaceholder;
module.exports.getTextBlock = getTextBlock;
module.exports.getHelpSet = getHelpSet;
module.exports.getException = getException;
module.exports.getPlaceholders = getPlaceholders;
module.exports.getTextBlocks = getTextBlocks;
module.exports.getExceptionsByLang = getExceptionsByLang;
module.exports.getHelpSets = getHelpSets;
