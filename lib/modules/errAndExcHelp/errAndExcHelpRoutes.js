'use strict';

let express = require('express');
let app = express.Router();

const helpCtrl = require('./controllers/errAndExcHelpCtrl.js');
const mw = require('./errAndExcHelpMiddleware');

// todo create middleware, that ...
//  ... checks if the passed data is valid for sets, placeholders, exceptions & text blocks

// mw.

// sets
app.post('/set', mw.isSetDataValid, helpCtrl.createHelpSet);
app.put('/sets/:setId', mw.isValidSetId, mw.isSetDataValid, helpCtrl.updateHelpSet);
app.delete('/sets/:setId', mw.isValidSetId, helpCtrl.deleteHelpSet);
app.get('/sets/:setId', mw.isValidSetId, helpCtrl.getHelpSet);
app.get('/sets', helpCtrl.getHelpSets);

// exceptions
app.post('/languages/:langId/exception', mw.isValidLangId, helpCtrl.createException);
app.put('/languages/:langId/exceptions/:exceptionId', mw.isValidLangId, mw.isValidExceptionId, mw.isExceptionDataValid, helpCtrl.updateException);
app.put('/languages/:langId/exceptions', mw.isValidLangId, mw.isExceptionBulkDataValid, helpCtrl.bulkUpsertExceptions);
app.delete('/exceptions/:exceptionId', mw.isValidExceptionId, helpCtrl.deleteException);
app.get('/exceptions/:exceptionId', mw.isValidExceptionId, helpCtrl.getException);
app.get('/languages/:langId/exceptions/', mw.isValidLangId, helpCtrl.getExceptionsByLang);

// placeholders
app.post('/languages/:langId/placeholder', mw.isValidLangId, mw.isPlaceholderDataValid, helpCtrl.createPlaceholder);
app.put('/languages/:langId/placeholders/:placeholderId', mw.isValidLangId, mw.isValidPlaceholderId, mw.isPlaceholderDataValid, helpCtrl.updatePlaceholder);
app.put('/languages/:langId/placeholders/', mw.isValidLangId, mw.isPlaceholderBulkDataValid, helpCtrl.bulkUpsertPlaceholders);
app.delete('/placeholders/:placeholderId', mw.isValidPlaceholderId, helpCtrl.deletePlaceholder);
app.get('/placeholders/:placeholderId', mw.isValidPlaceholderId, helpCtrl.getPlaceholder);
app.get('/languages/:langId/placeholders/', mw.isValidLangId, helpCtrl.getPlaceholders);

// text blocks
app.post('/sets/:setId/textBlock', helpCtrl.createTextBlock);
app.put('/sets/:setId/textBlocks/:textBlockId', helpCtrl.updateTextBlock);
app.put('/sets/:setId/textBlocks', helpCtrl.bulkUpsertTextBlocks);
app.delete('/sets/:setId/textBlocks/:textBlockId', helpCtrl.deleteTextBlock);
app.get('/sets/:setId/textBlocks/:textBlockId', helpCtrl.getTextBlock);
app.get('/sets/:setId/textBlocks/', helpCtrl.getTextBlocks);

module.exports = app;
