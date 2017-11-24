/**
 * Created by Marc Foletto on 23/11/2017.
 */
'use strict';

const ffmetadata = require('ffmetadata');

/**
 * Read Tag.
 * @var path = string
 *
 */
exports.read = function(filePath, cb) {

  ffmetadata.read(filePath, function(err, data) {
    if(err) return cb( err );
    cb( null, data );
  });

};

/**
 * Write meta Tag to a File
 *
 * @var path = string
 * @var data = JSON
 * @var cover path to jpeg file
 *
 */
exports.write = function(filePath, data, cover, cb){

  ffmetadata.write(filePath, data, {attachements: cover}, function(err) {
    if(err) return cb( err );
    cb( null, data );
  });

};
