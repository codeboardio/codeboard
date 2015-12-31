/**
 * Created by haches on 7/27/14.
 *
 * Controller for file uploads.
 */

var fs = require('fs'),
  path = require('path'),
  db = require('../models'),
  config = require('../config/config.js'),
  gm = require('gm');


/**
 * Function to resize the picture stored at aImgPath. The original picutre
 * will be overwritten with the resized one.
 * @param {string} aImgPath path and filename of the picture to resize
 * @param {int} aSize the pixel size to which to resize (ratio will be preserved)
 */
var resizePicture = function (aImgPath, aSize) {

  // determine the full path of to where the pictures are stored
  var imgPath = path.join(config.root, config.envFolder, aImgPath);

  try {
    gm(imgPath)
      .background('white')
      .flatten()
      .strip()
      .resize(aSize, aSize)
      .write(imgPath, function (err) {
        if (err) {
          console.log('Server.uploadCtrljs.resizePicture: Error with: ' + imgPath + '; Detail: ' + JSON.stringify(err));
        }
      });
  }
  catch (e) {
    console.log('Server.uploadCtrljs.resizePicture: Error trying to resize: ' + imgPath);
  }
};


/**
 * Function to handle the uploading of images.
 */
var userImage = function (req, res) {

  var relativePath = '';

  req.busboy.on('file', function (aFieldname, aFile, aFilename, aEncoding, aMimetype) {

    //console.log('File [' + aFieldname + ']: filename: ' + aFilename + ', encoding: ' + aEncoding + ', mimetype: ' + aMimetype);

    // Note: we create a filename with a random element in it.
    // This way, Angular will automatically detect the change in the URL and reload the picture
    // otherwise we'd have to trigger the reload manually which is cumbersome to do
    var randomNumber = Math.floor(Math.random() * 1000000000);

    // Note: we give all files a .jpg extension, even if they are png, gif or something else
    // Once the file is upload, we'll reformat it to jpg. This way, we can reuse the same name before
    // and after the reformating of the picture and don't need to worry if the correct filename is in the database.
    var newFileName = req.user.id + '_' + randomNumber + '.jpg';

    relativePath = path.join(config.userProfileImagePath, newFileName);

    // the path were we store the file
    var saveTo = path.join(config.root, config.envFolder, relativePath);

    var writeStream = fs.createWriteStream(saveTo);
    aFile.pipe(writeStream);

    writeStream.on('error', function (err) {
      console.log('Server.uploadCtrljs.userImage: Error during busboy.onFile event: ' + JSON.stringify(err));
    });

    aFile.on('end', function () {
      // called when the file is fully uploaded
      // console.log('Server.UploadCtrl: aFile.onEnd event');
    });
  });

  req.busboy.on('finish', function () {

    resizePicture(relativePath, 250);

    // update the url of the picture in the database (it might point to a default picture)
    // delete the previous picture
    db.User
      .find(req.user.id)
      .then(function (usr) {

        // delete the current user picture (if it's not one of the default smily pictures)
        var oldImagePath = usr.imageUrl;
        if (oldImagePath.search(/defaults\/smile/) == -1) {
          // if we're in here, then the regexp did not match on "defaults/smile" which is part of the default picture Url
          var fileToDelete = path.join(config.root, config.envFolder, oldImagePath);
          fs.unlink(fileToDelete, function (err) {
            if (err){
              console.log('Server.UploadCtrl: Error deleting user image: ' + fileToDelete);
            }
          });
        }

        // update the imageUrl to the new path
        return usr.updateAttributes({imageUrl: relativePath});
      })
      .then(function () {
        //console.log('Server.UploadCtrl: Busboy finished, sending 200 response.');
        res.json(200, {imageUrl: relativePath});
      });
  });

  return req.pipe(req.busboy);
};


module.exports = {
  userImage: userImage
};
