'use strict';

let express = require('express');
let app = express.Router();

const helpCtrl = require('./controllers/errAndExcHelpCtrl.js');
const mw = require('./errAndExcHelpMiddleware');


// sets
app.post('/set', mw.isSetDataValid, helpCtrl.createHelpSet);
app.put('/sets/:setId', mw.isValidSetId, mw.isSetDataValid, helpCtrl.updateHelpSet);
app.delete('/sets/:setId', mw.isValidSetId, helpCtrl.deleteHelpSet);
app.get('/sets/:setId', mw.isValidSetId, helpCtrl.getHelpSet);
app.get('/sets', helpCtrl.getHelpSets);

// exceptions
app.post('/exception', helpCtrl.createException);
app.put('/exceptions/:exceptionId', mw.isValidExceptionId, mw.isExceptionDataValid, helpCtrl.updateException);
app.delete('/exceptions/:exceptionId', mw.isValidExceptionId, helpCtrl.deleteException);
app.get('/exceptions/:exceptionId', mw.isValidExceptionId, helpCtrl.getException);
app.get('/languages/:langId/exceptions/', mw.isValidLangId, helpCtrl.getExceptionsByLang);
app.put('/languages/:langId/exceptions', mw.isValidLangId, mw.isExceptionBulkDataValid, helpCtrl.bulkUpsertExceptions);

// placeholders
app.post('/placeholder', mw.isPlaceholderDataValid, helpCtrl.createPlaceholder);
app.put('/placeholders/:placeholderId', mw.isValidPlaceholderId, mw.isPlaceholderDataValid, helpCtrl.updatePlaceholder);
app.delete('/placeholders/:placeholderId', mw.isValidPlaceholderId, helpCtrl.deletePlaceholder);
app.get('/placeholders/:placeholderId', mw.isValidPlaceholderId, helpCtrl.getPlaceholder);
app.get('/languages/:langId/placeholders/', mw.isValidLangId, helpCtrl.getPlaceholders);
app.put('/languages/:langId/placeholders/', mw.isValidLangId, mw.isPlaceholderBulkDataValid, helpCtrl.bulkUpsertPlaceholders);

// text blocks
app.post('/sets/:setId/textBlock', helpCtrl.createTextBlock);
app.put('/sets/:setId/textBlocks/:textBlockId', helpCtrl.updateTextBlock);
app.put('/sets/:setId/textBlocks', helpCtrl.bulkUpsertTextBlocks);
app.delete('/sets/:setId/textBlocks/:textBlockId', helpCtrl.deleteTextBlock);
app.get('/sets/:setId/textBlocks/:textBlockId', helpCtrl.getTextBlock);
app.get('/sets/:setId/textBlocks/', helpCtrl.getTextBlocks);

module.exports = app;
