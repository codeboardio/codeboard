/**
 * Service for language specific methods
 *
 * @author Janick Michot
 * @date 04.12.2020
 */

'use strict';


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



module.exports.isDynamicLanguage = isDynamicLanguage;
