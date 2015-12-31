'use strict';

var services = angular.module('codeboardApp');

services.factory('ProjectFactory', ['$http', '$routeParams', '$q', '$log', 'ProjectRes', 'ProjectSubmissionRes',
  function ($http, $routeParams, $q, $log, ProjectRes, ProjectSubmissionRes) {

    // an object that represents a project
    var project = {};

    var getProject = function () {
      return project;
    };

    var setProject = function (aProject) {
      project = aProject;
    }


    /**
     * Variable where we store the id of the last compilation response.
     * With the next compilation request, we'll send this id to trigger
     * an incremental compilation.
     * @type {string}
     */
    var lastCompilationId = '';


    // we store a hash of the project by the time we get it from the server
    var hashOfProject = '';

    /** Stores a hash of the current project */
    var setHashOfProject = function() {
      hashOfProject = getHashOfProject();
    }

    /**
     * Returns a SHA-256 hash of the current project object.
     * @return {*} a string that is the hash
     */
    var getHashOfProject = function() {


      var nodeArray = getNodeArray(getProject().files);

      // Note: we only use certain elements of a project and files
      // to determine if a user has changed something. This is neede,
      // e.g. because a file has properties like 'selected' that should not
      // be par of the hash calculation
      var hashMe = [];
      for(var i = 0; i < nodeArray.length; i++) {

        var node = {
          filename: nodeArray[i].filename,
          path: nodeArray[i].path,
          uniqueUId: nodeArray[i].uniqueUId,
          parentUId: nodeArray[i].parentUId,
          isFolder: nodeArray[i].isFolder,
          content: nodeArray[i].content
        }

        hashMe.push(node);
      }

      var shaObj = new jsSHA(angular.toJson(hashMe), "TEXT");
      return shaObj.getHash("SHA-256", "HEX");
    }


    /**
     * Check if the project has been modified based on comparing hashes.
     * @return {boolean} true if the current project hash is different from the hash last stored using 'setHashOfProject'
     */
    var isProjectModified = function() {
      var newHash = getHashOfProject();
      return newHash !== hashOfProject;
    }


    /**
     * @description Generates and returns a new node.
     *
     * @param filename {string}  the filename
     * @param path {string} the relative path of the node within the project
     * @param uniqueId {number} the unique id of this node within the scope of the project
     * @param parentUId {number} the unique id of the parent node of this node
     * @param {Object|*} options optional object with properties.
     * Supported properties are 'id' (default -1), 'isFolder' (default false), 'content' (default ''), 'isHidden' (default false)
     * @returns {Object} the newly created node object.
     */
    var getNewNode = function (filename, path, uniqueId, parentUId, options) {

      var n = {};

      n.id = options.id || -1;  // the id used in the database
      n.filename = filename; // note: the ide displays filename_annotated, defined further down
      n.path = path;
      n.uniqueId = uniqueId;  // the id unique within the scope of the project
      n.parentUId = parentUId; // the uniqueId of the parent node
      n.isFolder = options.isFolder || false;
      n.content = options.content || '';
      n.isHidden = options.isHidden || false;

      // now we add properties that are not stored in the db.

      // if the file is a folder it must store children nodes
      if (n.isFolder) {
        n.children = [];
      }

      // were we store the ace session
      if (!n.isFolder) {
        n.session = null;
      }

      // we put an annotation on the filename, based on the properties of the file
      n.filename_annotated = n.filename + getNodeAnnotation(n);

      return n;
    };


    /**
     * @description Returns a node based on the given nodeId.
     *
     * @param aUniqueNodeId {integer} an id for which the accompanying node should be returned
     * @return an object that represents a node of the project (null if id is invalid)
     */
    var getNode = function (aUniqueNodeId) {

      if(typeof aUniqueNodeId === 'string') {
        if(aUniqueNodeId.charAt(0) === 's') {
          // it's a request for a static library file

          // find out the url
          var index = aUniqueNodeId.substring(1);
          var url = getProject().staticFiles[index].url;

          // if we don't have content for the file yet we put a dummy message as content
          if(!getProject().staticFiles[index].content) {
            getProject().staticFiles[index].content = '-- Fetching file content. Please wait...';
            getProject().staticFiles[index].isContentSet = false;
          }


          return getProject().staticFiles[index];
        }
      }
      else {
        // we need to return null if a node for the given UID does not exist
        var resultNode = getProject().idToNodeMap[aUniqueNodeId];
        if(resultNode) {
          return resultNode;
        }
        else {
          return null;
        }
      }
    };


    var hasNode = function (aNodeId) {
      if (getProject().idToNodeMap[aNodeId]) {
        return true;
      }
      else {
        return false;
      }
    }


    /**
     * @description Hides or unhides a node, depending on wheather it's currently hidden or not.
     * @param aNode the node to hide or unhide
     */
    var setNodeHidden = function (aNode) {
      aNode.isHidden = !aNode.isHidden;

      // update the annotated filename
      aNode.filename_annotated = aNode.filename + getNodeAnnotation(aNode);
    }


    /**
     * Returns an annotation string, e.g. '(h)', that indicates the properties of a node.
     * @param aNode the node for which the annoation string should be calculated
     * @returns {string} the string represents the annotation that should be added the filename
     */
    var getNodeAnnotation = function (aNode) {

      var result = '';

      if (aNode.isHidden /* or some other node property is true */) {

        // the opening bracket
        result += ' (';

        // the character used to indicate that a file is hidden
        if (aNode.isHidden)
          result += 'h';

        // the closing bracket
        result += ')';
      }

      return result;
    }

    /**
     * @private
     * Sorting by name: function using to sort arrays (with filenames) by name.
     *
     * @param a a filename
     * @param b another filename
     * @returns {number} number -1, 0, or 1, according to what array sorting expects
     */
    var compareByName = function (a, b) {
      if (a > b)
        return 1;
      if (a < b)
        return -1;
      // a must be equal to b
      return 0;
    };


    /**
     * @private
     * @description Sorting by folder vs. file: function to sort an array so that folders come first, files there after.
     * Folders are sorted by filenames as are the files sorted by filenames.
     *
     * @param a a node object
     * @param b a node object
     * @returns {number}
     * @constructor
     */
    var compareByFileFolder = function (a, b) {

      if (a.isFolder && !b.isFolder)
        return -1;
      if (!a.isFolder && b.isFolder)
        return 1;
      if (a.isFolder && b.isFolder)
        return compareByName(a.filename, b.filename);
      if (!a.isFolder && !b.isFolder)
        return compareByName(a.filename, b.filename);

      return 0;
    };


    /**
     * @private
     * @description Adds a new node to the tree data structure.
     * The node is added as a child to the node provided in the argument.
     *
     * @param aParentNodeId {integer} id of the node to which a new node should be added.
     * Must be a folder, otherwise the function does not add a new node.
     * @param {object} aNode the node to add
     * @returns {object|null} returns the object that was created for a folder or file, or null is nothing was created
     */
    var addNodeFromDB = function (aParentNodeId, aNode) {

      // get the object that belongs to the given parent id
      var lParentNode = getProject().idToNodeMap[aParentNodeId];


      if (lParentNode.isFolder) {

        var lNewNode = getNewNode(
          aNode.filename,
          aNode.path,
          aNode.uniqueId,
          aNode.parentUId,
          {
            isFolder: aNode.isFolder,
            id: aNode.id, // the database id
            content: aNode.content,
            isHidden: aNode.isHidden
          }
        )

        // store a reference of the unique-id to the created node object
        getProject().idToNodeMap[lNewNode.uniqueId] = lNewNode;

        // add the new node to it's parent
        lParentNode.children.push(lNewNode);

        // sort the elements of children array based on their names
        lParentNode.children.sort(compareByFileFolder);


        // return the new object
        return lNewNode;
      } else {
        return null;
      }
    };


    /**
     * @private
     * @description Adds a new node to the tree data structure.
     * The node is added as a child to the node provided in the argument.
     *
     * @param aParentNodeId {integer} id of the node to which a new node should be added.
     * Must be a folder, otherwise the function does not add a new node.
     * @param {string} aName the name of the node to add
     * @param {boolean} aNewNodeIsFolder set to true if the node to add shall be a folder
     * @returns {object|null} returns the object that was created for a folder or file, or null is nothing was created
     */
    var addNode = function (aParentNodeId, aName, aNewNodeIsFolder) {

      // the parentNodeId (we use a variable because it might be changed)
      var lParentNodeId = aParentNodeId;

      // get the object that belongs to the given parent id
      var lParentNode = getProject().idToNodeMap[aParentNodeId];


      // in case the user has not selected a folder, we set the parent to be the parent-folder of the currently selected file
      if(!lParentNode.isFolder) {
        // the currently selected node is not a folder, thus we auto-select the parent of the currently selected file
        lParentNode = getProject().idToNodeMap[lParentNode.parentUId];

        // we're setting the parent node so we also have to set the parentNodeId
        lParentNodeId = lParentNode.uniqueId;
      }

      // we can only add files or folders to a folder
      if (lParentNode.isFolder) {
        // increase the unique id counter; the new id will be given to the new node
        getProject().lastUId += 1;

        // calculate the path of the to-be-created node
        // note: the root node has path '', we add a separator '/' unless we have the root node
        var lPathPrefix = lParentNode.path === '' ? '' : lParentNode.path + '/';

        var lNewNode = getNewNode(
          aName,
          lPathPrefix + getNode(lParentNodeId).filename,
          getProject().lastUId,
          lParentNodeId,
          {
            isFolder: aNewNodeIsFolder
          }
        )

        // store a reference of the unique-id to the created node object
        getProject().idToNodeMap[lNewNode.uniqueId] = lNewNode;

        // add the new node to it's parent
        lParentNode.children.push(lNewNode);

        // sort the elements of children array based on their names
        lParentNode.children.sort(compareByFileFolder);


        // return the new object
        return lNewNode;
      } else {
        return null;
      }
    };

    /**
     * @description Adds a new file to an existing folder.
     *
     * @param {integer} aParentNodeId id of the parent node to which a new file is added.
     * @param {string} aName the name fo the new file.
     * @returns {object|null} the object that was created for the file; null if nothing was created.
     */
    var addFile = function (aParentNodeId, aName) {
      return addNode(aParentNodeId, aName, false);
    };

    /**
     * @description Adds a new folder to the project. The newly added folder
     * will be a child of the provided node.
     *
     * @param {integer} aParentNodeId id of the parent node to which a new folder is added.
     * @param {string} aName the name of the folder.
     * @returns {object|null} the object that was created for the folder; null if nothing was created.
     */
    var addFolder = function (aParentNodeId, aName) {
      return addNode(aParentNodeId, aName, true);
    };


    /**
     * Renames an existing node with with the given new name.
     * Updates the properties filename and filename_annotated of the node.
     * @param aNodeId {integer} the id of the node to rename
     * @param aNewNodeName {string} the new name of the node
     */
    var renameNode = function (aNodeId, aNewNodeName) {

      // Helper function to recursively rename all the 'path' properties of children nodes.
      // aNode is the node which path needs an update, aNewPath the new path name for aNode
      var updatePath = function(aNode, aNewPath) {
        aNode.path = aNewPath;

        if(aNode.children) {

          for (var i = 0; i < aNode.children.length; i++) {
            updatePath(aNode.children[i], aNode.path + '/' + aNode.filename);
          }
        }
      }


      // get the node
      var n = getProject().idToNodeMap[aNodeId];

      if (n) {
        // set the new name of the node
        n.filename = aNewNodeName;
        // we put an annotation on the filename, based on the properties of the file
        n.filename_annotated = aNewNodeName + getNodeAnnotation(n);

        // if the node is a folder we need to rename the path of all sub-nodes
        if(n.isFolder) {
          updatePath(n, n.path); // Note: we're providing n.path because path is not changing for 'n' itself (only it's sub nodes)
        }

        // When renaming a node we want to start a fresh compilation
        // because Mantra might still hold a copy of the old file (before the rename).
        // To get a fresh compilation, we the the compilationId to an empty string.
        lastCompilationId = '';
      }
    }


    /**
     * @description Removes a node (file or folder) from the project. Note: will not allow the root node to be deleted.
     *
     * @param aNodeId {integer} the id of the node that should be removed. If aNodeId is unknown, no deletion happens.
     * @param aDeleteRecursive {boolean} if true, a folder will be deleted even if not empty. Otherwise, no deletion happens.
     */
    var removeNode = function (aNodeId, aDeleteRecursive) {

      if (getProject().idToNodeMap[aNodeId] !== undefined &&
          getProject().idToNodeMap[aNodeId].uniqueId !== 0 && // the node to delete is not the root node
          (
            !getProject().idToNodeMap[aNodeId].isFolder ||  // the node is a file
            getProject().idToNodeMap[aNodeId].children.length === 0 || // the node is folder but has no children
            aDeleteRecursive === true
          ) // all children should be deleted as well
        ) {
            var
              lNodeToDelete = getProject().idToNodeMap[aNodeId],
              lParentNode = getProject().idToNodeMap[lNodeToDelete.parentUId],
              lIndex = lParentNode.children.indexOf(lNodeToDelete);

            // remove the node from the array
            lParentNode.children.splice(lIndex, 1);
            // remove the node from the id to node-object map
            delete getProject().idToNodeMap[aNodeId];

            // When deleting a node we want to start a fresh compilation
            // because Mantra might still hold a copy of the deleted file.
            // To get a fresh compilation, we the the compilationId to an empty string.
            lastCompilationId = '';
      }
    };


    /**
     * Sets the project based on data that was send by the server.
     * @param projectDataFromServer {Object}
     * @param ltiData {Object} (optional) an object containing
     * @param staticFiles {Array} (optional) an array that
     */
    var setProjectFromJSONdata = function (projectDataFromServer, ltiData, staticFiles) {

      // default values for the two optional parameters
      var _ltiData = {}
        , _staticFiles = [];

      // set the lastCompilationId to be empty
      // Otherwise we might switch to a different project
      // but still use the lastCompilationId from the previous project
      lastCompilationId = '';


      if(Object.prototype.toString.call(arguments[1]) === '[object Object]') {
        _ltiData = arguments[1];
      }
      else if (Object.prototype.toString.call(arguments[1]) === '[object Array]') {
        _staticFiles = arguments[1];
      }

      if(Object.prototype.toString.call(arguments[2]) === '[object Array]') {
        _staticFiles = staticFiles;
      }


      var lProject = {
        // the name of the project
        name: projectDataFromServer.projectname,

        // the last unique Id that was used to create a file
        lastUId: projectDataFromServer.lastUId,

        // array that holds the (root) files
        files: [],

        // map from uids to nodes (i.e. file or folder objects)
        idToNodeMap: [],

        // programming language of the project
        language: projectDataFromServer.language,

        // data that might be relevant to an lti session; we create an empty object here and actually set if further down
        ltiData: {},

        // the role of the user who is currently looking at the project in the browser
        userRole: projectDataFromServer.userRole,

        // name of the user being inspected; the username only exists if we're looking at a submission or a userproject
        userBeingInspected: projectDataFromServer.username ? projectDataFromServer.username : null,

        // static files are library files (currently only used for Eiffel)
        staticFiles: _staticFiles
      }

      setProject(lProject);

      // set any Lti data for this project
      setLtiData(_ltiData);

      // get files (in flat from) as the server returned them
      // Note: for now we assume that projectDataFromServer always has a .fileSet property with at least 1 file
      // We should probably handle the case when that's not true
      var files = projectDataFromServer.fileSet;

      // make sure the files are sorted by parentUId
      files.sort(function compare(a, b) {
        if (a.parentUId < b.parentUId) //a is less than b by some ordering criterion
          return -1;
        if (a.parentUId > b.parentUId)//a is greater than b by the ordering criterion)
          return 1;
        // a must be equal to b
        return 0;
      });

      // add the first node (i.e. the root folder)
      var rootNode = getNewNode(
        files[0].filename,
        files[0].path,
        files[0].uniqueId,
        files[0].parentUId,
        {
          content: files[0].content,
          isFolder: files[0].isFolder,
          id: files[0].id,
          isHidden: files[0].isHidden
        }
      );


      getProject().files.push(rootNode);
      getProject().idToNodeMap[getProject().files[0].uniqueId] = getProject().files[0];

      // add the rest of the files (ignore the first one)
      for (var i = 1; i < files.length; i++) {
        addNodeFromDB(files[i].parentUId, files[i]);
      }

      // make sure we create a hash of the original version of the project
      setHashOfProject();
    };

    /**
     * Attaches the given ltiData to the project. It can afterwards
     * be accessed through getProject().ltiData.
     * @param aLtiData object containing ltiData
     */
    var setLtiData = function (aLtiData) {
      if(aLtiData.ltiSessionId && aLtiData.ltiUserId && aLtiData.ltiNonce) {
        getProject().ltiData = aLtiData;
        getProject().hasLtiData = true;
      }
      else {
        getProject().hasLtiData = false;
      }
    };


    /**
     * @description Given an array of nodes (e.g. getProject().files) this function returns a
     * single array that contains all the nodes as elements. The children[] array
     * is removed from the files
     * @param array the input array with a nested node structure through 'children[]'
     * @returns {Array} the array
     */
    var getNodeArray = function (array) {

      var result = [];

      for (var i in array) {

        var f = [
          {
            filename: array[i].filename,
            path: array[i].path,
            content: array[i].content,
            uniqueId: array[i].uniqueId,
            parentUId: array[i].parentUId,
            isFolder: array[i].isFolder,
            id: array[i].id,
            isHidden: array[i].isHidden
          }
        ];

        if (array[i].children)
          result = result.concat(getNodeArray(array[i].children), f);
        else
          result = result.concat(f);

      }

      return result;
    }


    /**
     * Stores the current project on the server.
     * @returns a Promise that resolves to true if the storing was successful, otherwise rejects with false.
     */
    var saveProjectToServer = function () {

      var payload = {
        project: {
          lastUId: getProject().lastUId
        },
        files: getNodeArray(getProject().files)
      };

      // if the current user is an LTI user, we attach her LTI information
      // LTI users can save their changes to a private project without having access right to the project
      if(getProject().hasLtiData) {
        payload.hasLtiData = getProject().hasLtiData;
        payload.ltiData = getProject().ltiData;
      }

      // create the promise that is returned
      var deferred = $q.defer();

      ProjectRes.update(
        {projectId: $routeParams.projectId},
        payload,
        function success(data, status, header, config) {

          // make sure we update the hash of the project
          // (because from now on any change compares to the hash of the newly stored version)
          setHashOfProject();

          // resolve the promise to true
          deferred.resolve(true);
        },
        function error(data, status, header, config) {

          // resolve the promise to false
          deferred.reject(false);
        }
      );

      return deferred.promise;
    }


    var getPayloadForCompilation = function (runCleanCompile) {

      // get all the files of the projects but an flat array (don't need nested arrays)
      var projectFiles = getNodeArray(getProject().files);

      // the payload we send to the server
      var payload = {};
      // the files send as part of the payload
      var payloadFiles = [];

      for (var i in projectFiles) {

        // we don't need to send folders, only files with content
        if (!projectFiles[i].isFolder) {

          var f = projectFiles[i].path + '/' + projectFiles[i].filename;
          var payloadFile = {
            filename: f,
            content: projectFiles[i].content
          }

          payloadFiles.push(payloadFile);
        }
      }

      // construct the payload
      payload.files = payloadFiles;
      payload.language = getProject().language;
      payload.action = 'compile';
      if (lastCompilationId !== '' && !(runCleanCompile)) {
        // we already have previous compilation result, so we want to trigger incremental compilation
        payload.id = lastCompilationId;
      }

      // attach information about lit session (ltiData might be an empty object)
      payload.hasLtiData = getProject().hasLtiData;
      payload.ltiData = getProject().ltiData;

      // return the payload object
      return payload;
    };


    /**
     * Compiles the current project on the server.
     * @param runCleanCompile if true, a clean compile will be executed, otherwise a regular compilation
     * @returns a promise that resolves when a the compilation result is received
     */
    var compileProject = function (runCleanCompile) {

      var payload = getPayloadForCompilation(runCleanCompile);

      // create the promise that is returned
      var deferred = $q.defer();

      // make call to the server
      ProjectRes.save(
        {projectId: $routeParams.projectId},
        payload,
        function success(data, status, header, config) {
          // store the id of the compilation so we can use the next time we make a request
          lastCompilationId = data.id;

          // resolve the promise
          deferred.resolve(data);
        },
        function error(response) {
          // there was an error while trying to run the project. We remove the stored compilationId to ensure
          // we can start fresh
          lastCompilationId = '';

          // compose the error message
          var _errorMsg = '\n-- Error details --';
          if (response.status && response.data && response.data.msg) {
            _errorMsg += '\nStatus code: ' + response.status;
            _errorMsg += '\nError message: ' + response.data.msg;
          }
          else {
            // the Codeboard server should always return an error that has a status and data.msg
            // for the rare cases where, e.g. there's no internet connection, we give a full dump
            // of the error message
            _errorMsg += '\n' + JSON.stringify(response);
          }

          // reject the promise and forward the reason the the compilation service returned
          deferred.reject(_errorMsg);
        }
      );

      return deferred.promise;
    }


    /**
     * Compiles the current project on the server.
     * @param runCleanCompile if true, a clean compile will be executed, otherwise a regular compilation
     * @returns a promise that resolves when a the compilation result is received
     */
    var runProject = function () {

      // the payload we send to the server
      var payload = {};

      // construct the payload
      payload.language = getProject().language;
      payload.action = 'run';
      payload.id = lastCompilationId;

      // attach information about lit session (ltiData might be an empty object)
      payload.hasLtiData = getProject().hasLtiData;
      payload.ltiData = getProject().ltiData;

      // create the promise that is returned
      var deferred = $q.defer();

      // make call to the server
      ProjectRes.save(
        {projectId: $routeParams.projectId},
        payload,
        function success(value, responseHeaders) {
          // resolve the promise
          deferred.resolve(value);
        },
        function error(response) {

          // there was an error while trying to run the project. We remove the stored compilationId to ensure
          // we can start fresh
          lastCompilationId = '';

          // compose the error message
          var _errorMsg = '\n-- Error details --';
          if (response.status && response.data && response.data.msg) {
            _errorMsg += '\nStatus code: ' + response.status;
            _errorMsg += '\nError message: ' + response.data.msg;
          }
          else {
            // the Codeboard server should always return an error that has a status and data.msg
            // for the rare cases where, e.g. there's no internet connection, we give a full dump
            // of the error message
            _errorMsg += '\n' + JSON.stringify(response);
          }

          // reject the promise and forward the reason the the compilation service returned
          deferred.reject(_errorMsg);
        }
      );

      return deferred.promise;
    };


    var testProject = function() {

      var payload = getPayloadForCompilation(true);
      payload.action = 'test';

      // create the promise that is returned
      var deferred = $q.defer();

      // make call to the server
      ProjectRes.save(
        {projectId: $routeParams.projectId},
        payload,
        function success(data, status, header, config) {
          // store the id of the compilation so we can use the next time we make a request
          lastCompilationId = data.id;
          // resolve the promise
          deferred.resolve(data);
        },
        function error(response) {
          // there was an error while trying to run the project. We remove the stored compilationId to ensure
          // can start fresh
          lastCompilationId = '';



          // TODO: upgrade this error according to the error message for compile and run
          // reject the promise and forward the reason the the compilation service returned
          var _errorMsg = '\n-- Error details --';

          _errorMsg += '\nStatus text: ';
          _errorMsg += response.statusText ? response.statusText : 'not available';

          _errorMsg += '\nStatus code: ';
          _errorMsg += response.status ? response.status : 'not available';

          _errorMsg += '\nError no: ';
          _errorMsg += response.data && response.data.cause && response.data.cause.errno ? response.data.cause.errno : 'not available';

          _errorMsg += '\nError output: ';
          _errorMsg += response.data && response.data.output ? response.data.output : 'not available';

          // reject the promise and forward the reason the the compilation service returned
          deferred.reject(_errorMsg);
        }
      );

      return deferred.promise;
    };


    var toolAction = function() {

      var payload = getPayloadForCompilation(true);
      payload.action = 'tool';

      // create the promise that is returned
      var deferred = $q.defer();

      // make call to the server
      ProjectRes.save(
        {projectId: $routeParams.projectId},
        payload,
        function success(data, status, header, config) {

          // resolve the promise

          // TODO: what gets returned?
          deferred.resolve(data);
        },
        function error(response) {
          // there was an error while trying to run the project. We remove the stored compilationId to ensure
          // can start fresh
          lastCompilationId = '';

          // reject the promise and forward the reason the the compilation service returned
          var errorMsg = '\n-- Error details --';

          errorMsg += '\n\nStatusCode: ';
          errorMsg += response.status ? response.status : 'no status code available';

          errorMsg += '\nMsg: ';
          errorMsg += response.data.msg ? response.data.msg : 'no error details available';

          // reject the promise and forward the reason the the compilation service returned
          deferred.reject(errorMsg);
        }
      );

      return deferred.promise;
    }


    /**
     * Submits the current project to the server.
     * @returns a promise that resolves when a the submission was completed
     */
    var submitProject = function () {

      var payload = getPayloadForCompilation(false);

      // the above payload contains the files in a form that's suited for Mantra compilation
      // however, we also want to store the files in the DB in format that we later load them
      // back into the IDE (e.g. when teacher inspects a submission); that's why we also send
      // the data in it's "default" form
      payload.filesInDefaultFormat = getNodeArray(getProject().files);

      // we also want to know in which "role" the submission was done
      // Note: this is needed because depending on the role, the server needs to treat hidden files differently
      payload.userRole = getProject().userRole;


      // create the promise that is returned
      var deferred = $q.defer();

      // make call to the server
      ProjectSubmissionRes.save(
        {projectId: $routeParams.projectId},
        payload,
        function success(data, status, header, config) {
          // resolve the promise
          deferred.resolve(data);
        },
        function error(response) {
          // reject the promise
          deferred.reject(response);
        }
      );

      return deferred.promise;
    }


    // Public API here
    return {
      getProject: getProject,
      addFile: addFile,
      addFolder: addFolder,
      renameNode: renameNode,
      removeNode: removeNode,
      getNode: getNode,
      hasNode: hasNode,
      setNodeHidden: setNodeHidden,
      setProjectFromJSONdata: setProjectFromJSONdata,
      saveProjectToServer: saveProjectToServer,
      compileProject: compileProject,
      runProject: runProject,
      testProject: testProject,
      toolAction: toolAction,
      submitProject: submitProject,
      isProjectModified: isProjectModified,

      // the following are only exported for testing
      getNodeArray: getNodeArray,
      getNewNode: getNewNode
    };
  }]);
