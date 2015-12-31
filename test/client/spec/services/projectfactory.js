'use strict';

/**
 * Tests for the ProjectFactory.
 *
 * author: haches
 *
 */


describe('Service: ProjectFactory', function () {

  // load the service's module
  beforeEach(module('codeboardApp'));

  // instantiate service
  var ProjectFactory;

  // before running each test, we create a fresh ProjectFactory
  beforeEach(inject(function (_ProjectFactory_) {
    ProjectFactory = _ProjectFactory_;
  }));


  // the test-data we use to create a new project
  var projectJSONdata = {
    projectname: 'TestProject',
    lastUId: 20,
    language: 'Java',
    fileSet: [
      {filename: 'Root', path: '', uniqueId: 0, parentUId: -1, isFolder: true, content: '', isHidden: 0}
    ]
  };


  // Won't work anymore because we removed the createNewProject function
  describe('Creating a new project', function () {

    it('should have a function to create a project based on a JSON object', function () {
      should.exist(ProjectFactory.setProjectFromJSONdata);
    });

    it('should be possible to create new project with name "ProjectName" and root folder "RootFolder"', function () {

      should.exist(ProjectFactory.getProject);

      // create the project
      ProjectFactory.setProjectFromJSONdata(projectJSONdata);


      ProjectFactory.getProject().name.should.equal(projectJSONdata.projectname);
      ProjectFactory.getProject().lastUId.should.equal(20);
      ProjectFactory.getNode(0).exists;
      ProjectFactory.getProject().files.length.should.equal(1);
      ProjectFactory.getProject().files[0].filename.should.equal(projectJSONdata.fileSet[0].filename);
    });

  });


  describe('Adding files to the project', function () {

    it('should have a function to add a new file to the project', function () {
      should.exist(ProjectFactory.addFile);
    });

    it('should be possible to add a new file to a given folder', function () {

      // create the project
      ProjectFactory.setProjectFromJSONdata(projectJSONdata);

      var lFileName = 'MyNewFile';
      var lProjectName = 'ProjectName', lRootFolder = 'RootFolder';


      // the root node should not have any children yet
      ProjectFactory.getNode(0).children.length.should.equal(0);

      // get a reference to the root node
      var lRootNode = ProjectFactory.getNode(0);


      // add a new file to the root node
      var lNewFileObject = ProjectFactory.addFile(lRootNode.uniqueId, lFileName);

      // check that new node has the right name
      lNewFileObject.filename.should.equal(lFileName);
      // check that the new node has a unique id
      lNewFileObject.uniqueId.should.equal(projectJSONdata.lastUId + 1);
      // check the reference to the parent's uid
      lNewFileObject.parentUId.should.equal(lRootNode.uniqueId);

      // check that the root node now has child
      lRootNode.children.length.should.equal(1);
    });
  });


  describe('adding folders to the project', function () {

    it('should have a function to add a new folder to the project', function () {
      should.exist(ProjectFactory.addFolder);
    });

    it('should be possible to add a new folder to a given folder', function () {

      var lFolderName = 'MyNewFolder';
      var lProjectName = 'ProjectName', lRootFolder = 'RootFolder';

      // create the project
      ProjectFactory.setProjectFromJSONdata(projectJSONdata);

      var lRootNode = ProjectFactory.getNode(0);
      var lRootNodeNumOfChildren = lRootNode.children.length;

      // the root node should not have any children yet
      lRootNode.children.length.should.equal(0);

      // add a new file to the root node
      var lNewFolderObject = ProjectFactory.addFolder(lRootNode.uniqueId, lFolderName);

      // check that new node has the right name
      lNewFolderObject.filename.should.equal(lFolderName);
      // check that the new node has a unique id
      lNewFolderObject.uniqueId.should.equal(projectJSONdata.lastUId + 1);
      lNewFolderObject.parentUId.should.equal(lRootNode.uniqueId);
      // check that new node is a folder
      lNewFolderObject.isFolder.should.be.true;

      // check that the root node now has child
      lRootNode.children.length.should.equal(lRootNodeNumOfChildren + 1);

    });

    it('folders are sorted alphabetically', function () {


      // given folders with name 'Z', 'A', 'b', and '4a'

      // setup the test project
      ProjectFactory.setProjectFromJSONdata(projectJSONdata);
      var lRootNode = ProjectFactory.getNode(0);

      // setup a sub-folder of the root folder
      var Z = ProjectFactory.addFolder(lRootNode.uniqueId, 'Z');
      var A = ProjectFactory.addFolder(lRootNode.uniqueId, 'A');
      var b = ProjectFactory.addFolder(lRootNode.uniqueId, 'b');
      var four_a = ProjectFactory.addFolder(lRootNode.uniqueId, '4a');

      lRootNode.children.should.eql([four_a, A, Z, b]);
    });

  });


  describe('files and folders are sorted', function () {

    var lRootNode, folder_A, folder_B, file_fileZ, file_fileA;

    beforeEach(function () {
      // setup the root folder
      ProjectFactory.setProjectFromJSONdata(projectJSONdata);
      lRootNode = ProjectFactory.getNode(0);

      // add two folders
      folder_B = ProjectFactory.addFolder(lRootNode.uniqueId, 'B');
      folder_A = ProjectFactory.addFolder(lRootNode.uniqueId, 'A');

      // add two files
      file_fileZ = ProjectFactory.addFile(lRootNode.uniqueId, 'FileZ');
      file_fileA = ProjectFactory.addFile(lRootNode.uniqueId, 'FileA')
    });

    it('adding a file will maintain alphabetical sorting of files', function () {
      var file_file17 = ProjectFactory.addFile(lRootNode.uniqueId, 'File17');

      lRootNode.children.should.eql([folder_A, folder_B, file_file17, file_fileA, file_fileZ]);
    });

  });


  describe('Removing a file or folder from the project', function () {

    var lRootNode, lFolderNode, lFileNode;

    beforeEach(function () {
      // setup the root folder
      ProjectFactory.setProjectFromJSONdata(projectJSONdata);
      lRootNode = ProjectFactory.getNode(0);

      // setup a sub-folder of the root folder
      lFolderNode = ProjectFactory.addFolder(lRootNode.uniqueId, "NewFolder");

      // setup a file in the root folder
      lFileNode = ProjectFactory.addFile(lRootNode.uniqueId, "NewFile");
    });

    it('should have a function to remove a node', function () {
      should.exist(ProjectFactory.removeNode);
    });

    it('is possible to remove a selected file', function () {

      // root node has two children
      lRootNode.children.length.should.equal(2);

      // remove node (but not recursively)
      ProjectFactory.removeNode(lFileNode.uniqueId, false);

      // check that the root node has only one child left
      lRootNode.children.length.should.equal(1);
      // check that the folder node is still a child of the root node
      lRootNode.children.indexOf(lFolderNode).should.be.above(-1);
    });


    it('is possible to recursively remove a selected folder and its child nodes', function () {

      // add another file to the project
      ProjectFactory.addFile(lFolderNode.uniqueId, 'AnotherFile');
      // add another folder to the project
      ProjectFactory.addFile(lFolderNode.uniqueId, 'AnotherFolder');

      // check that the node now has two children
      lFolderNode.children.length.should.equal(2);

      // try to delete the node (without enabling recursive delete)
      ProjectFactory.removeNode(lFolderNode.uniqueId, false);

      // check that the node was not deleted
      lFolderNode.children.length.should.equal(2);

      // try to delete the node with enabling recursive delete
      ProjectFactory.removeNode(lFolderNode.uniqueId, true);

      // check that node no longer exists
      lRootNode.children.length.should.equal(1);
    });

  });


  describe('Retrieving a node based on a uid', function () {


    var lRootNode, lFile1Node, lFile2Node;


    beforeEach(function () {
      // setup the root folder
      ProjectFactory.setProjectFromJSONdata(projectJSONdata);
      lRootNode = ProjectFactory.getNode(0);

      // setup a sub-folder of the root folder
      lFile1Node = ProjectFactory.addFile(lRootNode.uniqueId, "File1");

      // setup a file in the root folder
      lFile2Node = ProjectFactory.addFile(lRootNode.uniqueId, "File2");
    });


    it('is possible to get access to a project node based on the nodes uid', function () {
      // look up the first file based on the uid
      var uid1 = lFile1Node.uniqueId;
      ProjectFactory.getNode(uid1).should.equal(lFile1Node);

      // look up the second file based on the uid
      var uid2 = lFile2Node.uniqueId;
      ProjectFactory.getNode(uid2).should.equal(lFile2Node);

    });


    it('is possible to provide invalid uids and get null as a return value', function () {
      // providing a random number (999) should return null
      should.equal(ProjectFactory.getNode(999), null);
    });

  });


  describe('Nodes and their children can be flattened into a single array', function () {


    it('is possible to handle an empty project', function () {
      // setup the root folder
      ProjectFactory.setProjectFromJSONdata(projectJSONdata);

      // the expected flattened array
      var expectedResult = [{filename: 'Root', path: '', content: '', uniqueId: 0, parentUId: -1, isFolder: true, id: -1, isHidden: false}];

      // test for the expected result
      ProjectFactory.getNodeArray(ProjectFactory.getProject().files).should.eql(expectedResult);
    });


    it('is possible to flatten multiple files', function () {

      // setup the root folder
      ProjectFactory.setProjectFromJSONdata(projectJSONdata);
      var lRootNode = ProjectFactory.getNode(0);

      // setup a file in the root folder
      var lFile1Node = ProjectFactory.addFile(lRootNode.uniqueId, "File1");

      // setup a file in the root folder
      var lFile2Node = ProjectFactory.addFile(lRootNode.uniqueId, "File2");

      // the expected result
      var expectedResult = [
        {filename: 'File1', path: 'Root', content: '', uniqueId: 21, parentUId: 0, isFolder: false, id: -1, isHidden: false},
        {filename: 'File2', path: 'Root', content: '', uniqueId: 22, parentUId: 0, isFolder: false, id: -1, isHidden: false},
        {filename: 'Root', path: '', content: '', uniqueId: 0, parentUId: -1, isFolder: true, id: -1, isHidden: false}
      ];

      ProjectFactory.getNodeArray(ProjectFactory.getProject().files).should.eql(expectedResult);
    });
  });


  it('is possible to flatten deeply nested multiple files', function () {

    // setup the root folder
    ProjectFactory.setProjectFromJSONdata(projectJSONdata);
    var lRootNode = ProjectFactory.getNode(0);

    // setup a sub-folders of the root folder
    var lFolder1Node = ProjectFactory.addFolder(lRootNode.uniqueId, "Folder1");
    var lFolder2Node = ProjectFactory.addFolder(lFolder1Node.uniqueId, "Folder2");

    // setup a file in the deeply nested folder
    var lFile1Node = ProjectFactory.addFile(lFolder2Node.uniqueId, "File1");

    // the expected result
    var expectedResult = [
      {filename: 'File1', path: 'Root/Folder1/Folder2', content: '', uniqueId: 23, parentUId: 22, isFolder: false, id: -1, isHidden: false},
      {filename: 'Folder2', path: 'Root/Folder1', content: '', uniqueId: 22, parentUId: 21, isFolder: true, id: -1, isHidden: false},
      {filename: 'Folder1', path: 'Root', content: '', uniqueId: 21, parentUId: 0, isFolder: true, id: -1, isHidden: false},
      {filename: 'Root', path: '', content: '', uniqueId: 0, parentUId: -1, isFolder: true, id: -1, isHidden: false}
    ];

    ProjectFactory.getNodeArray(ProjectFactory.getProject().files).should.eql(expectedResult);
  });

});
