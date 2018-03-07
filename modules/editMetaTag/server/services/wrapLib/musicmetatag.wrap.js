/**
 * Created by Marc Foletto on 18/12/2017.
 */

const mm = require('music-metadata');

/**
 * Read Tag With music-metadata
 * @param filePath
 * @param cb
 */
exports.read = function read (filePath, cb) {
  mm.parseFile(filePath,
    {
      native: false,
      duration: true,
      skipCovers: true
    }
  )
    .then(function (metadata) {
      try {
        let cleanMeta = {};

        cleanMeta.title = metadata.common.title || '';
        cleanMeta.artist = metadata.common.artist || '';
        cleanMeta.album = metadata.common.album || '';

        // Change date to string
        cleanMeta.year = metadata.common.year ? (metadata.common.year + '') : '';

        // Change time to ms in MM:SS and convert it to string
        if (metadata.format.duration) {
          cleanMeta.time = new Date(metadata.format.duration * 1000).toISOString().substr(11, 8);
          if (cleanMeta.time.substr(0, 2) === '00') cleanMeta.time = cleanMeta.time.substr(3, 6);
        } else {
          cleanMeta.time = '';
        }

        // Convert Genre in tab and split well for exemple this case
        // [ 'pop,rock' , 'jazz' ] => [ 'pop', 'rock', 'jazz']
        cleanMeta.genre = metadata.common.genre ? metadata.common.genre.join(', ').split(/\s*[,;\/]\s*/) : [];

        // cleanMeta.albumartist doesn't exist if null empty
        cleanMeta.albumartist = metadata.common.albumartist || '';

        // cleanMeta.composer doesn't exist if null empty
        cleanMeta.composer = metadata.common.composer.join('/') || '';

        // @todo implement label
        cleanMeta.label = '';

        // Forge track field
        if (metadata.common.track) {
          if (metadata.common.track.no === null) {
            cleanMeta.trackno = '0';
          } else {
            cleanMeta.trackno = (metadata.common.track.no + '').replace(/^0+(?=\d)/, '');
          }
          if (metadata.common.track.of === null) {
            cleanMeta.trackof = '0';
          } else {
            cleanMeta.trackof = (metadata.common.track.of + '').replace(/^0+(?=\d)/, '');
          }
        } else {
          cleanMeta.trackno = '0';
          cleanMeta.trackof = '0';
        }

        // Forge Disk field
        if (metadata.common.disk) {
          if (metadata.common.disk.no === null) {
            cleanMeta.diskno = '0';
          } else {
            cleanMeta.diskno = (metadata.common.disk.no + '').replace(/^0+(?=\d)/, '');
          }
          if (metadata.common.disk.of === null) {
            cleanMeta.diskof = '0';
          } else {
            cleanMeta.diskof = (metadata.common.disk.of + '').replace(/^0+(?=\d)/, '');
          }
        } else {
          cleanMeta.diskno = '0';
          cleanMeta.diskof = '0';
        }


        // NOT Trim Obj beacause mm already does that
        cb(null, cleanMeta);
      } catch (e) {
        console.log('Error when reading/cleaning tag with mm');
        console.trace(e);
        cb(e);
      }
    })
    .catch(function (err) {
      cb(err);
    });
};

/**
 * Extract Picture from a track with music-metadata
 */
function readPict (filePath, cb) {
  mm.parseFile(filePath,
    {
      native: false,
      duration: false,
      skipCovers: false
    }
  )
    .then((metadata) => {
      if (metadata && metadata.common.picture[0]) {
        return cb(null,
          {
            pict: metadata.common.picture[0].data,
            ext: metadata.common.picture[0].format
          }
        );
      }
      cb(null, null);
    })
    .catch(function (err) {
      cb(err);
    });
}
exports.readPict = readPict;


exports.readPictAndSave = function readPictAndSave (input, output, cb) {
  const saveToJpeg = require('../picture.server.services');

  readPict(input, (err, data) => {
    if (err) return cb(err);
    saveToJpeg.saveToJpeg(data.pict, output, cb)
  }
  );
};
