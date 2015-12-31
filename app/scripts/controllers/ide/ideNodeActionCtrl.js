'use strict';
/**
 * Created by hce on 4/23/14.
 */

var app = angular.module('codeboardApp');

app.controller('IdeNodeActionCtrl', ['$scope', '$rootScope', '$uibModal', '$log', 'IdeMsgService',
  function($scope, $rootScope, $uibModal, $log, IdeMsgService) {

    // Constants used by this controller
    var CONST = {
      ADD_NODE_OPERATION: 'add',
      RENAME_NODE_OPERATION: 'rename',
      NODE_TYPE_FILE: 'file',
      NODE_TYPE_FOLDER: 'folder'
    };


    /**
     * Call this method to trigger the displaying of the modal for adding a new node.
     * @param aNodeId {integer} the unique id of the node (this is currently only used for renaming)
     * @param aNodeName {String} name of the node that should be renamed (for adding a node, this argument is ignored)
     * @param aNodeType {String} value of either 'file' or 'folder'
     * @param aOperationType {String} value of either 'add' or 'rename' (determines the modal behavior and layout)
     */
    var openNodeModal = function(aNodeId, aNodeName, aNodeType, aOperationType) {


      /*
       * The controller for the logic of the model
       */
      var ideNodeModalCtrl = ['$scope', '$uibModalInstance', 'data', function($scope, $uibModalInstance, data) {

        // Please note that $uibModalInstance represents a modal window (instance) dependency.
        // It is not the same as the $uibModal service used above.


        $scope.data = {
          nodeName: data.nodeName,
          nodeType: data.nodeType,
          operationType: data.operationType
        };


        // the modal is used for adding files, adding folders, renaming files, renaming folders
        // the text in the modal is adjusted depending on which operation is currently done
        // here we have the default values (for the case of adding a file)
        $scope.labels = {
          heading: 'Add file',
          label: 'Enter the name of the new file:',
          btnOk: 'Add file',
          btnCancel: 'Cancel'
        }


        // During initialization of the controller we set the correct labels
        var init = function() {
          // determine the labels used by the modal based on the type of operation to be performed
          if(data.operationType === CONST.RENAME_NODE_OPERATION) {
            // labels need to represent renaming
            $scope.labels.heading = 'Rename ' + data.nodeType;
            $scope.labels.label = 'Enter a new name for ' + data.nodeName + ':';
            $scope.labels.btnOk = 'Rename ' + data.nodeType;
          }
          else if (data.operationType === CONST.ADD_NODE_OPERATION) {
            // labels need to represent adding file or folder
            $scope.labels.heading = 'Add ' + data.nodeType;
            $scope.labels.label = 'Enter the name of the new ' + data.nodeType + ':';
            $scope.labels.btnOk = 'Add ' + data.nodeType;
          }
        }();


        $scope.ok = function() {
          $uibModalInstance.close($scope.data);
        };


        $scope.cancel = function() {
          $uibModalInstance.dismiss('cancel');
        };


        /** Function to close the modal when a user hits the Enter key. */
        $scope.submit = function(formData) {
          $scope.data.nodeName = formData.nodeName;
          $scope.ok();
        }


        /**
         * Function returns a check function used by the ng-pattern.
         * Note: Angular trims leading and trailing whitespaces in the ng-model.
         * Thus, leading and trailing whitespaces won't trigger a pattern violation.
         */
        $scope.isValid = (function(aFileName) {

          // regexp to check for valid filenames
          // we only allow filenames that have underscore, score or period in it and they must have a file format
          var regexpFiles = /^[0-9a-zA-Z\-\_\.]+\.{1}[0-9a-zA-Z]{1,4}$/;
          // regexp to check for valid foldernames
          var regexpFolders = /^[0-9a-zA-Z\-\_\.]+$/;

          // the regexp that will actually be used (by default set to file)
          var regexp = regexpFiles;

          if($scope.data.nodeType === CONST.NODE_TYPE_FOLDER) {
            regexp = regexpFolders;
          }

          // the function used by ng-pattern
          // Note: this is a neat hack so we don't need to write our own directive and can use ng-pattern
          // see also http://stackoverflow.com/questions/18900308/angularjs-dynamic-ng-pattern-validation
          return {
            test: function(value) {
              return regexp.test(value);
            }
          };
        })(); // we execute the function to for ng-pattern it looks like a simple data value


        /**
         * Error message if the node name provided by the user is not valid.
         * @returns {string} error message
         */
        $scope.getFormDataErrorMsg = function() {

          if ($scope.data.nodeType === CONST.NODE_TYPE_FILE) {
            return "Filename format: only use characters a-Z, numbers 0-9, '.', '-', and '_'. Make sure to provide a filename extension. Example: My_File.txt";
          }
          else {
            return "Foldername format: only use characters a-Z, numbers 0-9, '.', '-', and '_'. Example: My_Folder";
          }
        }

      }];


      // Defines the modal object
      var modalInstance = $uibModal.open({
        templateUrl: 'ideNewNodeModal.html',  // Note: this is not an html file but the id property of the html that makes the modal
        controller: ideNodeModalCtrl,         // Note: the controller must be declared before this assignment is done
        size: 'sm',
        resolve: {
          data: function() {
            return {nodeName: aNodeName, nodeType: aNodeType, operationType: aOperationType};
          }
        }
      });


      // defines what happens when the modal is closed
      modalInstance.result
        .then(
        function(aData) {

          if (aData.operationType === CONST.ADD_NODE_OPERATION) {
            // aData is expected to have two string properties: 'nodeName' and 'nodeType'
            // We use the event bus to send message about the new node's name and type
            var req = IdeMsgService.msgNewNodeNameAvailable(aData.nodeName, aData.nodeType);
            $rootScope.$broadcast(req.msg, req.data);
          }
          else if (aData.operationType === CONST.RENAME_NODE_OPERATION) {
            // aNode is expected to have two string properties: 'nodeName' and 'nodeType'
            // use event bus to send message about the new node's name

            var req = IdeMsgService.msgRenameNodeNameAvailable(aNodeId, aData.nodeName);
            $rootScope.$broadcast(req.msg, req.data);
          }
        },
        function() {
          $log.debug('Modal dismissed by user.');
        });

    };


    /**
     * Event bus listener for 'add a new node' events.
     * Will trigger the 'add a new node modal window' to open.
     */
    $scope.$on(IdeMsgService.msgNewNodeRequest().msg, function(aEvent, aMsgData) {

      // when a node should be added, we don't give the modal window an pre-existing node name
      var lNodeName = '';
      // the msg data should have node type 'file' or 'folder'
      var lNodeType = aMsgData.nodeType === 'file' ? CONST.NODE_TYPE_FILE: CONST.NODE_TYPE_FOLDER;

      // open the modal
      openNodeModal(-1, lNodeName, lNodeType, CONST.ADD_NODE_OPERATION);
    });


    /**
     * Event bus listener for 'rename a node' events.
     * Will trigger the 'rename node modal window' to open.
     */
    $scope.$on(IdeMsgService.msgDisplayRenameNodeModalRequest().msg, function(aEvent, aMsgData) {

      // when a node should be renamed, we need to keep track of its id
      var lNodeId = aMsgData.nodeId;
      // when a node should be renamed, we give the modal window the current name of that node
      var lNodeName = aMsgData.nodeName;
      // the msg data should have node type 'file' or 'folder'
      var lNodeType = aMsgData.nodeType === 'file' ? CONST.NODE_TYPE_FILE: CONST.NODE_TYPE_FOLDER;

      // open the modal
      openNodeModal(lNodeId, lNodeName, lNodeType, CONST.RENAME_NODE_OPERATION);
    });

  }]);
