'use strict';

angular.module('codeboardApp')
  .service('IdeMsgService', function IdeMsgService() {
    // AngularJS will instantiate a singleton by calling "new" on this function


    /**
     * Returns msg object for request that a file should be displayed in the editor.
     * @param {number} aNodeId the unique id of the node that should be displayed
     * @return {{msg: string, data: {nodeId: *}}}
     */
    this.msgDisplayFileRequest = function (aNodeId, forceReload = false) {
      return {
        msg: 'ide.displayFileRequest',
        data: {nodeId: aNodeId, forceReload: forceReload}
      };
    };

    /**
     * Returns msg object for request that the current node should be forced to reload
     * @return {{msg: string}}
     */
    this.msgForceReloadCurrentNode = function () {
      return {
        msg: 'ide.forceReloadCurrentNode'
      };
    };

    /**
     * Returns msg object for requests of new nodes (files or folders).
     * @param {string} aNodeType which type of node was requested ('file' or 'folder')
     * @return {{msg: string, data: {nodeType: *}}}
     */
    this.msgNewNodeRequest = function (aNodeType) {
      return {
        msg: 'ide.newNodeRequest',
        data: {nodeType: aNodeType}
      };
    };

    /**
     * Returns msg object for requests of new image.
     * @author Janick Michot
     * @return {{msg: string}}
     */
    this.msgNewImageNodeRequest = function () {
      return {
        msg: 'ide.newImageNodeRequest'
      };
    };

    /**
     * Returns msg object for storing a new image.
     * @author Janick Michot
     * @param {string} aNodeType which type of node was requested ('file' or 'folder')
     * @return {{msg: string, data: {nodeType: *}}}
     */
    this.msgSaveImageNodeRequest = function (aImagePath, aImageName) {
      return {
        msg: 'ide.saveImageNodeRequest',
        data: {imagePath: aImagePath, imageName: aImageName}
      };
    };

    /**
     * Returns msg object used to signal that the user has provided a name for a new file or folder.
     * @param {string} aNodeName the name for the new node
     * @param {string} aNodeType the type of the node ('file' or 'folder')
     * @return {{msg: string, data: {nodeName: *}}}
     */
    this.msgNewNodeNameAvailable = function (aNodeName, aNodeType) {
      return {
        msg: 'ide.newNodeNameAvailable',
        data: {nodeName: aNodeName, nodeType: aNodeType}
      };
    };


    /**
     * Returns msg object for requests to rename a node.
     * Called, e.g. when user clicks on "rename" action in the IDE menu.
     * @return {{msg: string}}
     */
    this.msgRenameNodeRequest = function() {
      return {
        msg: 'ide.renameNodeRequest'
      };
    };


    /**
     * Returns msg object for requests to rename a node (file or folder).
     * @param aNodeId {integer} the uniqueId of the node that should be renamed
     * @param aNodeName {string} the current name of the node that should be renamed
     * @param {string} aNodeType the type of the node ('file' or 'folder')
     * @return {{msg: string, data: {nodeId: *, nodeName: *, nodeType: *}}}
     */
    this.msgDisplayRenameNodeModalRequest = function(aNodeId, aNodeName, aNodeType) {
      return {
        msg: 'ide.displayRenameNodeModalRequest',
        data: {nodeId: aNodeId, nodeName: aNodeName, nodeType: aNodeType}
      };
    };


    /**
     * Returns msg object for confirming that a node was rename.
     * @param aNodeId {integer} the id of the node
     * @param aNewNodeName the uniqueId of the node that was removed
     * @return {{msg: string, data: {nodeId: *, nodeName: *}}}
     */
    this.msgRenameNodeNameAvailable = function(aNodeId, aNewNodeName) {
      return {
        msg: 'ide.renameNodeNameAvailable',
        data: {nodeId: aNodeId, nodeName: aNewNodeName}
      };
    };


    /**
     * Returns msg object for requests to remove a node (file or folder).
     * @return {{msg: string}}
     */
    this.msgRemoveNodeRequest = function() {
      return {
        msg: 'ide.removeNodeRequest'
      };
    };

    /**
     * Returns msg object for confirming that a node was removed.
     * @param aUniqueId the uniqueId of the node that was removed
     * @return {{msg: string, data: {uniqueId: *}}}
     */
    this.msgRemoveNodeConfirmation = function(aUniqueId) {
      return {
        msg: 'ide.removeNodeConfirmation',
        data: {uniqueId: aUniqueId}
      };
    };


    /**
     * Returns msg object used to signal that the project should be saved to the server.
     * @return {{msg: string}}
     */
    this.msgSaveProjectRequest = function () {
      return {
        msg: 'ide.saveProjectRequest'
      };
    };

    /**
     * Returns msg object used to signal that the currently displayed project should be saved.
     * @return {{msg: string}}
     */
    this.msgSaveCurrentlyDisplayedContent = function () {
      return {
        msg: 'ide.saveCurrentlyDisplayedContent'
      };
    };


    /**
     * Returns msg object used to signal that a node should be hidden/unhidden.
     * @return {{msg: string}}
     */
    this.msgHideNodeRequest = function () {
      return {
        msg: 'ide.hideNodeRequest'
      };
    };

    /**
     * Returns msg object used to signal that a node should be static or not.
     * @author Janick Michot
     * @return {{msg: string}}
     */
    this.msgMakeNodeStaticNodeRequest = function () {
      return {
        msg: 'ide.uneditableNodeRequest'
      };
    };


    /**
     * Returns msg object used to signal that project should be compiled.
     * @return {{msg: string}}
     */
    this.msgCompileRequest = function () {
      return {
        msg: 'ide.compileRequest'
      };
    };


    /**
     * Returns msg object used to signal that project should be clean-compiled.
     * @return {{msg: string}}
     */
    this.msgCompileCleanRequest = function () {
      return {
        msg: 'ide.compileCleanRequest'
      };
    };


    /**
     * Returns msg object used to signal that project should be run.
     * @return {{msg: string}}
     */
    this.msgRunRequest = function () {
      return {
        msg: 'ide.runRequest'
      };
    };


    /**
     * Returns msg object used to signal that the current action should be stopped.
     * @return {{msg: string}}
     */
    this.msgStopRequest = function () {
      return {
        msg: 'ide.stopRequest'
      };
    };

      /**
       * Returns msg object used to signal that project should be compiled and run.
       * @return {{msg: string}}
       */
      this.msgCompileAndRunRequest = function () {
          return {
              msg: 'ide.compileAndRunRequest'
          };
      };


    /**
     * Returns msg object used to signal that an action that can be stopped
     * by the user is now available (usually that means a user program is running).
     * @return {{msg: string}}
     */
    this.msgStoppableActionAvailable = function () {
      return {
        msg: 'ide.stoppableActionAvailable'
      };
    };


    /**
     * Returns msg object used to signal that an action that can be stopped
     * is no longer available (usually that means a user program has terminated).
     * @return {{msg: string}}
     */
    this.msgStoppableActionGone = function () {
      return {
        msg: 'ide.stoppableActionGone'
      };
    };


    /**
     * Returns msg object used to signal that project should be tested.
     * @return {{msg: string}}
     */
    this.msgTestRequest = function () {
      return {
        msg: 'ide.testRequest'
      };
    };

    /**
     * Returns msg object used to signal that project should be tested.
     * @return {{msg: string}}
     */
    this.msgTestRequestNew = function () {
      return {
        msg: 'ide.testRequestNew'
      };
    };


    /**
     * Returns msg object used to signal that project should be tested.
     * @return {{msg: string}}
     */
    this.msgToolRequest = function () {
      return {
        msg: 'ide.toolRequest'
      };
    };


    /**
     * Returns msg object used to signal that project solution should be submitted.
     * @return {{msg: string}}
     */
    this.msgSubmitRequest = function () {
      return {
        msg: 'ide.SubmitRequest'
      };
    };


    /**
     * Returns msg object used to signal that a student wants to reset the solution.
     * @return {{msg: string}}
     */
    this.msgResetRequest = function () {
      return {
        msg: 'ide.ResetRequest'
      };
    };

    /**
     * Returns msg object used when a user want back to the course overview
     * @return {{msg: string}}
     */
    this.msgTakeMeHomeRequest = function () {
      return {
        msg: 'ide.takeMeHomeRequest'
      };
    };


    /**
     * Returns msg object used to signal that the editor should be shown or hidden.
     * @param {boolean} aDisplayEditor if true, the editor should be hidden, else should be displayed
     * @return {Object} an object of form {msg: string, {data: {displayEditor: boolean}}
     */
    this.msgDisplayEditorRequest = function (aDisplayEditor) {
      return {
        msg: 'ide.displayEditorRequest',
        data: {displayEditor: aDisplayEditor}
      };
    };


    /**
     * Returns msg object used to signal that the tree model should updated with respect to the ProjectFactory.
     * @return {{msg: string}}
     */
    this.msgReloadTreeFromProjectFactory = function () {
      return {
        msg: 'ide.reloadTreeFromProjectFactory'
      };
    };

    /**
     * Returns msg object used to signal that the editor settings shall be displayed.
     * @return {{msg: string, data: {settings: {theme, fontSize, handler: string, tabSize: int, invisibles, gutter: String}}}}
     */
    this.msgShowEditorSettingsRequest = function (currentSettings) {
      return {
        msg: 'ide.showEditorSettingsRequest',
        data: {settings: currentSettings}
      };
    };

    /**
     * Returns msg object used to signal that the editor settings where changed.
     * @return {{msg: string, data: {settings: {theme, fontSize, handler: string, tabSize: int, invisibles, gutter: String}}}}
     */
    this.msgEditorSettingsChanged = function (currentSettings) {
      return {
        msg: 'ide.editorSettingsChanged',
        data: {settings: currentSettings}
      };
    };


    /**
     * Returns msg object used to signal that the editor should recalculate it's size.
     * @return {{msg: string}}
     */
    this.msgEditorResizeRequest = function () {
      return {
        msg: 'ide.editorResizeRequest'
      };
    };


    /**
     * Returns msg object used to signal that the URI query string for "?view=..." should be processed.
     * @return {{msg: string}}
     */
    this.msgProcessViewQueryStringRequest = function () {
      return {
        msg: 'ide.processViewQueryStringRequest'
      };
    };


    /**
     * Returns msg object used to signal that the modal for sharing the project should be shown.
     * @return {{msg: string}}
     */
    this.msgShowShareProjectModalRequest = function () {
      return {
        msg: 'ide.showShareProjectModalRequest'
      };
    };

    /**
     * Returns msg object used to signal that the modal for sharing the project should be shown.
     * @return {{msg: string}}
     * @author Janick Michot
     */
    this.msgTestRequestOpenModal = function () {
      return {
        msg: 'ide.testRequestOpenModal'
      };
    };

    /**
     * This broadcast can be used to disable a navBarRightTab from within a controller
     * @return {{msg: string}}
     * @author Janick Michot
     */
    this.msgNavBarRightDisableTab = function (slug) {
      return {
        msg: 'ide.navBarRightDisableTab',
        data: { "slug": slug }
      };
    };

    /**
     * This broadcast can be used to enable a navBarRightTab from within a controller
     * @return {{msg: string}}
     * @author Janick Michot
     */
    this.msgNavBarRightEnableTab = function (slug) {
      return {
        msg: 'ide.navBarRightEnableTab',
        data: { "slug": slug }
      };
    };

    /**
     * This broadcast can be used to disable a navBarRightTab from within a controller
     * @param tabId
     * @returns {{msg: string, data: {tabId: *}}}
     */
    this.msgNavBarRightOpenTab = function (tab, doIoTest) {
      // this is only relevant for the test-tab.. if the test-tab gets opened from the info-tab the test should not start automatically.. therefore we pass doIoTest as false in that broadcast call... default is doIoTest=true
      if (typeof doIoTest === 'undefined') { doIoTest = true; }
      return {
        msg: 'ide.navBarRightOpenTab',
        data: { "tab": tab, "doIoTest": doIoTest },
      };
    };


    /**
     * This broadcast is triggered when a successful submission has been made
     * @returns {{msg: string}}
     */
    this.msgSuccessfulSubmission= function () {
      return {
        msg: 'ide.successfulSubmission'
      };
    };


    /**
     * This broadcast is triggered when a new message is added to the help tab
     * @param msg
     * @param type
     * @param sender
     * @returns {{msg: string, data: {msg: *, sender: *, type: *}}}
     */
    this.msgAddHelpMessage= function (msg, type, sender, avatar) {
      return {
        msg: 'ide.addHelpMessage',
        data: { msg: msg, type: type, sender: sender, avatar: avatar }
      };
    };
  });
