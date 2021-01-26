/**
 * The controller for handling requests related
 * to automated help.
 *
 * @author Janick Michot
 * @date 26.01.2021
 */

'use strict';

const {ErrAndExcHelpSet, ErrAndExcHelpException, ErrAndExcHelpPlaceholder,
    ErrAndExcHelpTextBlock, User, Lang, Course} = require('../models');


/** - - - Help Sets - - - **/

/**
 * Returns the data used to create and update help sets.
 * @param req
 * @returns {{title: *, langId: *, userId: *, desc: *}}
 */
let _helpSetData = function(req) {

    // todo validation

    return {
        title: req.body.title,
        desc: req.body.desc,
        userId: req.body.userId,
        langId: req.body.langId
    };
};

/**
 * Creates a new help set.
 * @param req
 * @param res
 */
let createHelpSet = function(req, res) {
    ErrAndExcHelpSet.create(_helpSetData(req))
        .then(function(aSet) {
           if(aSet) {
               res.status(201).json(aSet);
           } else {
               res.status(500).send();
           }
        })
        .catch(function() {
            res.status(500).send();
        });
};

/**
 * Returns an existing help set by id.
 * todo use service errAndExcHelpSrv.getHelpSet(id, attributes)
 * @param req
 * @param res
 */
let getHelpSet = function(req, res) {
    const setId = req.params.setId;
    ErrAndExcHelpSet.findByPk(setId)
        .then(function(aSet) {
            if(aSet) {
                res.status(201).json(aSet);
            } else {
                res.status(404).json({msg: "Help Set with Id " + setId + " not found."});
            }
        })
        .catch(function() {
            res.status(500).send();
        });
};

/**
 * Updates an existing help set by id.
 * todo use service errAndExcHelpSrv.getHelpSet(id, attributes)
 * @param req
 * @param res
 */
let updateHelpSet = function(req, res) {
    const setId = req.params.setId;
    ErrAndExcHelpSet.findByPk(setId)
        .then(function(aSet) {
            if(aSet) {
                return aSet.update(_helpSetData(req))
                    .then(function(up) {
                        return aSet;
                    });
            }
            return aSet;
        })
        .then(function(aSet) {
            if(aSet) {
                res.status(201).json(aSet);
            } else {
                res.status(500).send({msg: "Could not update update help set with id " + setId});
            }
        })
        .catch(function() {
            res.status(500).send({msg: "Could not update update help set with id " + setId});
        });
};

/**
 * Deletes a help set by id.
 * @param req
 * @param res
 */
let deleteHelpSet = function(req, res) {
    const setId = req.params.setId;
    ErrAndExcHelpSet.destroy({
        where: {
            id: setId
        }
    })
        .then(function(aSet) {
            if(aSet) {
                res.status(201).json({msg: "Exception with id " + setId + " deleted"});
            } else {
                res.status(500).send({msg: "Cloud not delete set with id " + setId});
            }
        })
        .catch(function() {
            res.status(500).send({msg: "Cloud not delete set with id " + setId});
        });
};


/** - - - Exceptions - - - **/

/**
 * Returns the data used to create and update a exception
 * @param req
 * @returns {{phase: *, matching_type: *, title: *, priority: *, langId: *, desc: *, matching: *}}
 */
let _exceptionData = function(req) {
    // todo validate data

    return {
        title: req.body.title,
        desc: req.body.desc,
        matching: req.body.matching,
        matching_type: req.body.matching_type,
        phase: req.body.phase,
        priority: req.body.priority,
        langId: req.body.langId
    };
};

/**
 * Creates an exception with the given data.
 * @param req
 * @param res
 */
let createException = function(req, res) {
    ErrAndExcHelpException.create(_exceptionData(req))
        .then(function(aException) {
            if(aException) {
                res.status(201).json(aException);
            } else {
                res.status(500).send({msg: "Could not create exception"});
            }
        })
        .catch(function() {
            res.status(500).send({msg: "Could not create exception"});
        });
};

/**
 * Returns a exception by id.
 * @param req
 * @param res
 */
let getException = function(req, res) {
    const exceptionId = req.params.exceptionId;
    ErrAndExcHelpException.findByPk(exceptionId)
        .then(function(aSet) {
            if(aSet) {
                res.status(201).json(aSet);
            } else {
                res.status(404).json({msg: "Exception with Id " + exceptionId + " not found."});
            }
        })
        .catch(function() {
            res.status(500).send();
        });
};

/**
 * Updates an exception by its id.
 * @param req
 * @param res
 */
let updateException = function(req, res) {
    const exceptionId = req.params.exceptionId;
    ErrAndExcHelpException.findByPk(exceptionId)
        .then(function(aException) {
            if(aException) {
                return aException.update(_exceptionData(req))
                    .then(function() {
                        return aException;
                    });
            }
            return aException;
        })
        .then(function(aException) {
            if(aException) {
                res.status(201).json(aException);
            } else {
                res.status(500).send({msg: "Could not update exception with id " + exceptionId});
            }
        })
        .catch(function() {
            res.status(500).send({msg: "Could not update exception with id " + exceptionId});
        });
};

/**
 * Deletes and exception by its id.
 * @param req
 * @param res
 */
let deleteException = function(req, res) {
    const exceptionId = req.params.exceptionId;
    ErrAndExcHelpException.destroy({
        where: {
            id: exceptionId
        }
    })
        .then(function(aException) {
            if(aException) {
                res.status(201).json({msg: "Exception with id " + exceptionId + " deleted"});
            } else {
                res.status(500).json({msg: "Could not delete exception with id " + exceptionId});
            }
        })
        .catch(function (err) {
            res.status(500).json({msg: "Could not delete exception with id " + exceptionId});

        });
};

/** - - - Get Placeholder Data - - - **/

/**
 * Returns the data used to create or update a placeholder
 * @param req
 * @returns {{regex: *, title: *, langId: *, desc: *}}
 */
let _placeholderData = function(req) {
    // todo validate data
    return {
        title: req.body.title,
        desc: req.body.desc,
        regex: req.body.regex,
        langId: req.body.langId
    };
};

/**
 * Creates a placeholder with the given data
 * @param req
 * @param res
 */
let createPlaceholder = function(req, res) {
    ErrAndExcHelpPlaceholder.create(_placeholderData(req))
        .then(function(aPlaceholder) {
            if(aPlaceholder) {
                res.status(201).json(aPlaceholder);
            } else {
                res.status(500).send({msg: "Could not create placeholder"});
            }
        })
        .catch(function() {
            res.status(500).send({msg: "Could not create placeholder"});
        });
};

/**
 * Returns a placeholder by given id.
 * @param req
 * @param res
 */
let getPlaceholder = function(req, res) {
    const placeholderId = req.params.placeholderId;
    ErrAndExcHelpPlaceholder.findByPk(placeholderId)
        .then(function(aPlaceholder) {
            if(aPlaceholder) {
                res.status(201).json(aPlaceholder);
            } else {
                res.status(404).json({msg: "Placeholder with Id " + placeholderId + " not found."});
            }
        })
        .catch(function() {
            res.status(500).send();
        });
};

/**
 * Updates an placeholder by id with the given data.
 * @param req
 * @param res
 */
let updatePlaceholder = function(req, res) {
    const placeholderId = req.params.placeholderId;
    ErrAndExcHelpPlaceholder.findByPk(placeholderId)
        .then(function(aPlaceholder) {
            if(aPlaceholder) {
                return aPlaceholder.update(_placeholderData(req))
                    .then(function() {
                        return aPlaceholder;
                    });
            }
            return aPlaceholder;
        })
        .then(function(aPlaceholder) {
            if(aPlaceholder) {
                res.status(201).json(aPlaceholder);
            } else {
                res.status(500).send({msg: "Could not update placeholder with id " + placeholderId});
            }
        })
        .catch(function() {
            res.status(500).send({msg: "Could not update placeholder with id " + placeholderId});
        });
};

/**
 * Deletes a placeholder by its id.
 * @param req
 * @param res
 */
let deletePlaceholder = function(req, res) {
    const placeholderId = req.params.placeholderId;
    ErrAndExcHelpPlaceholder.destroy({
        where: {
            id: placeholderId
        }
    })
        .then(function(aPlaceholder) {
            if(aPlaceholder) {
                res.status(201).json({msg: "Placeholder with id " + placeholderId + " deleted"});
            } else {
                res.status(500).json({msg: "Could not delete placeholder with id " + placeholderId});
            }
        })
        .catch(function (err) {
            res.status(500).json({msg: "Could not delete placeholder with id " + placeholderId});

        });
};


/** - - - Text Blocks - - - **/

/**
 * Returns the data used to create or update a text block
 * @param req
 * @returns {{block_type: *, exceptionId: *, setId: *, text: *}}
 * @private
 */
let _textBlockData = function(req) {
    // todo validate
    return {
        text: req.body.text,
        block_type: req.body.block_type,
        exceptionId: req.body.exceptionId,
        setId: req.body.setId
    };
};

/**
 * Creates a text block with the given data.
 * @param req
 * @param res
 */
let createTextBlock = function(req, res) {
    let data = _textBlockData(req);
    data.setId = req.params.setId;
    ErrAndExcHelpTextBlock.create(data)
        .then(function(aTextBlock) {
            if(aTextBlock) {
                res.status(201).json(aTextBlock);
            } else {
                res.status(500).send({msg: "Could not create text block."});
            }
        })
        .catch(function(err) {
            res.status(500).send({msg: "Could not create text block."});
        });
};

/**
 * Updates a text block with the given data by id.
 * @param req
 * @param res
 */
let updateTextBlock = function(req, res) {
    const textBlockId = req.params.textBlockId;
    ErrAndExcHelpTextBlock.findByPk(textBlockId)
        .then(function(aTextBlock) {
            if(aTextBlock) {
                return aTextBlock.update(_textBlockData(req))
                    .then(function() {
                        return aTextBlock;
                    });
            }
            return aTextBlock;
        })
        .then(function(aTextBlock) {
            if(aTextBlock) {
                res.status(201).json(aTextBlock);
            } else {
                res.status(500).send({msg: "Could not update text block with id " + textBlockId});
            }
        })
        .catch(function() {
            res.status(500).send({msg: "Could not update text block with id " + textBlockId});
        });
};

/**
 * Deletes a text block by id.
 * @param req
 * @param res
 */
let deleteTextBlock = function(req, res) {
    const textBlockId = req.params.textBlockId;
    ErrAndExcHelpTextBlock.destroy({
        where: {
            id: textBlockId
        }
    })
        .then(function(aTextBlock) {
            if(aTextBlock) {
                res.status(201).json({msg: "Text block with id " + textBlockId + " deleted"});
            } else {
                res.status(500).send({msg: "Cloud not delete text block with id " + textBlockId});
            }
        })
        .catch(function() {
            res.status(500).send({msg: "Cloud not delete text block with id " + textBlockId});
        });
};

/**
 * Returns a text block by id.
 * @param req
 * @param res
 */
let getTextBlock = function(req, res) {
    const textBlockId = req.params.textBlockId;
    ErrAndExcHelpTextBlock.findByPk(textBlockId)
        .then(function(aTextBlock) {
            if(aTextBlock) {
                res.status(201).json(aTextBlock);
            } else {
                res.status(404).json({msg: "Text block with Id " + textBlockId + " not found."});
            }
        })
        .catch(function() {
            res.status(500).send();
        });
};



/**
 * Returns a list with all sets
 * todo move to errAndExcHelp.getSets(attributes);
 * @param req
 * @param res
 */
let getHelpSets = function(req, res) {
    ErrAndExcHelpSet.findAll()
        .then(function(errAndExcHelpSets) {
            if(errAndExcHelpSets) {
                res.status(201).json(errAndExcHelpSets);
            } else {
                res.status(404).json({msg: "No sets found."});
            }
        })
        .catch(function() {
            res.status(500).send();
        });
};

/**
 * Returns a list of placeholder by lang.
 * @param req
 * @param res
 */
let getPlaceholders = function(req, res) {
    ErrAndExcHelpPlaceholder.findAll({where: {langId: req.params.langId}})
        .then(function(errAndExcHelpPlaceholders) {
            if(errAndExcHelpPlaceholders) {
                res.status(201).json(errAndExcHelpPlaceholders);
            } else {
                res.status(404).json({msg: "No placeholders found."});
            }
        })
        .catch(function() {
            res.status(500).send();
        });
};

let getTextBlocks = function(req, res) {
    ErrAndExcHelpTextBlock.findAll({where: {setId: req.params.setId}})
        .then(function(errAndExcHelpTextBlock) {
            if(errAndExcHelpTextBlock) {
                res.status(201).json(errAndExcHelpTextBlock);
            } else {
                res.status(404).json({msg: "No text blocks found."});
            }
        })
        .catch(function() {
            res.status(500).send();
        });
};

let getExceptions = function(req, res) {
    ErrAndExcHelpException.findAll({where: {langId: req.params.langId}})
        .then(function(errAndExcHelpException) {
            if(errAndExcHelpException) {
                res.status(201).json(errAndExcHelpException);
            } else {
                res.status(404).json({msg: "No exceptions found."});
            }
        })
        .catch(function() {
            res.status(500).send();
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
module.exports.getExceptions = getExceptions;
module.exports.getHelpSets = getHelpSets;
