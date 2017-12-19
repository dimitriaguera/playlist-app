/**
 * Created by Marc Foletto on 23/11/2017.
 */

try {

  // Js wrap for taglib
  const taglib2Wrap = require('./wrapLib/taglib2.wrap');

  exports.read = taglib2Wrap.read;
  exports.readPict = taglib2Wrap.readPict;
  exports.readPictAndSave = taglib2Wrap.readPictAndSave;

  exports.metaLibName = 'taglib2';

  console.log('Meta music lib used: taglib2');

} catch(e) {

  try {

    // Pure Js MusicMeta
    const mmWrap = require('./wrapLib/musicmetatag.wrap');


    exports.read = mmWrap.read;
    exports.readPict = mmWrap.readPict;
    exports.readPictAndSave = mmWrap.readPictAndSave;

    exports.metaLibName = 'music-metadata';

    console.log('Meta music lib used: music-metadata');

  } catch(e) {

    try {

      // Ffmetadata use ffmpeg cli
      const ffmetadataWrap = require('./wrapLib/ffmetadata.wrap');

      exports.read = ffmetadataWrap.read;
      exports.metaLibName = 'ffmetadata';

      console.log('Meta music lib used: ffmetadata');

    } catch(e) {
      console.error('No lib for reading meta');
    }

  }

}
