/**
 * This service handle the interactions with the ace Editor
 *
 * @author Samuel Truniger
 * @date 25.04.2023
 */

'use strict';

angular.module('codeboardApp').service('AceEditorSrv', [
  '$rootScope',
  function ($rootScope) {
    var service = this;

    // Listen to the 'change' event of the Ace Editor / got the Code from the Ace Docs - https://ace.c9.io/#nav=howto
    service.aceChangeListener = function (aceEditor, callback) {
      aceEditor.on('change', function () {
        callback();
      });
    };

    // listen to the 'mousedown' event to get line of the click / got code from stackoverflow - https://stackoverflow.com/questions/41647661/how-to-check-if-the-mouse-is-down-in-aceeditor
    service.mouseDownListener = function (aceEditor, callback) {
      aceEditor.on('mousedown', function (e) {
        callback(e);
      });
    };

    // listen to 'enter-keypress' event to reset cursorPosition / got part of code from stackoverflow - https://stackoverflow.com/questions/7060750/detect-the-enter-key-in-a-text-input-field
    service.enterKeyListener = function (aceEditor, callback) {
      aceEditor.container.addEventListener('keypress', function (e) {
        callback(e);
      });
    };

    // get the current code in the ace editor
    service.getInputCode = function (aceEditor) {
      var inputCode = aceEditor
        .getSession()
        .getValue()
        .replace(/ +/g, ' ')
        .replace(/\s*\;\s*$/g, ';')
        .split('\n');
      return inputCode;
    };
  },
]);
