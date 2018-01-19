/**
 * Created by Marc Foletto on 23/11/2017.
 */


/**
 * taglib2Wrap.read(filePath, cb)
 *
 * return
 *
 * {
 *  title: 'title',
 *  artist: 'artist',
 *  album: 'album',
 *  year: '1951',
 *  genre: ['blues','rock'],
 *  albumartist: 'albumartist',
 *  composer: 'composer',
 *  trackno: '0',
 *  trackof: '0',
 *  diskno: '0',
 *  diskof: '0'
 * }
 *
 */

try {

  // Js wrap for taglib
  const taglib2Wrap = require('./wrapLib/taglib2.wrap');

  exports.read = taglib2Wrap.read;
  exports.readPict = taglib2Wrap.readPict;
  exports.readPictAndSave = taglib2Wrap.readPictAndSave;
  exports.saveMeta = taglib2Wrap.saveMeta;
  exports.metaLibName = 'taglib2';

} catch(e) {

  try {

    // Pure Js MusicMeta
    const mmWrap = require('./wrapLib/musicmetatag.wrap');

    exports.read = mmWrap.read;
    exports.readPict = mmWrap.readPict;
    exports.readPictAndSave = mmWrap.readPictAndSave;

    exports.metaLibName = 'music-metadata';

  } catch(e) {

      console.error('No lib for reading meta');
      exports.metaLibName = null;
  }

}
