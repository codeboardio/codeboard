/**
 * Service for language specific methods
 *
 * ATTENTION: todo im Moment besteht die Anwendung sowohl aus den statischen Languages aus dem original
 *
 * @author Janick Michot
 * @date 04.12.2020
 */

'use strict';


const { Lang } = require('../models');


/**
 * Defines all the 'language' project types that are using dynamic languages
 */
const _dynamicLanguageProjects = ['Python'];


/**
 * Checks if language is dynamic or not
 * @param language
 * @returns {boolean}
 */
let isDynamicLanguage = function (language) {
    return (_dynamicLanguageProjects.indexOf(language) !== -1);
};

/**
 * Returns a promise that resolves to a lang by the given language id
 * @param langId
 * @param attributes
 * @returns {Promise<Model | null> | Promise<Model>}
 */
let getLang = function(lang, attributes = ['id', 'name', 'isDynamicLanguage', 'ver']) {
    return Lang.findOne({
        where: {name: lang},
        attributes: attributes
    });
};



module.exports.isDynamicLanguage = isDynamicLanguage;
module.exports.getLang = getLang;
