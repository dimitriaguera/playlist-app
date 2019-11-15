/**
 * Created by Marc Foletto on 23/11/2017.
 */
'use strict';

let jimp, sharp;

try {
  // Js wrap for libvips
  sharp = require('sharp');
  console.log('Image Tools : sharp');

  exports.saveToJpeg = function(input, output, cb) {
    sharp(input)
      // .resize(width, height)
      .jpeg({ quality: 60 })
      .toFile(output, cb);
  };
} catch (e) {
  try {
    // Pure Js
    jimp = require('jimp');
    console.log('Image Tools : jimp');

    exports.saveToJpeg = function(input, output, cb) {
      jimp.read(input, function(err, pict) {
        if (err) return cb(err);
        pict
          // .resize(256, 256)            // resize
          .quality(60) // set JPEG quality
          // .greyscale()                 // set greyscale
          .write(output, (err, data) => {
            if (err) return cb(err);
            data.bitmap.data = null;
            cb(null, data);
          }); // save
      });
    };
  } catch (e) {
    console.error('No Image Tools');
  }
}
