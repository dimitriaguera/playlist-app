/**
 * Created by Marc Foletto on 18/12/2017.
 */

const taglib2 = require('taglib2');
const trimObj = require('../../../../core/server/services/obj.server.services');

/**
 * Read Tag With TagLib2
 * @param filePath
 * @param cb
 */
exports.read = function (filePath, cb) {
  try {
    const metadata = taglib2.readTagsSync(filePath);

    let cleanMeta = {};

    cleanMeta.title = metadata.title || null;
    cleanMeta.artist = metadata.artist || null;
    cleanMeta.album = metadata.album || null;

    // Change date to string
    cleanMeta.year = metadata.year ? (metadata.year + '') : null;

    cleanMeta.time = metadata.time || null;

    // Convert Genre in tab and split it
    // [ 'pop', 'rock', 'jazz']
    cleanMeta.genre = metadata.genre ? metadata.genre.split(/\s*[,;\/]\s*/) : [];

    // cleanMeta.albumartist composer doesn't exist if null empty
    if (metadata.albumartist) cleanMeta.albumartist = metadata.albumartist;
    if (metadata.composer) cleanMeta.composer = metadata.composer;

    // Convert track number to string and split in no and of and
    // remove leading 0
    let trackNb = metadata.tracknumber || metadata.track;
    if (trackNb) {
      trackNb = (trackNb + '').split('/');
      cleanMeta.track = {
        'no': (trackNb[0]) ? trackNb[0].replace(/^0+(?=\d)/, '') : '0',
        'of': (trackNb[1]) ? trackNb[1].replace(/^0+(?=\d)/, '') : '0',
      }
    } else {
      cleanMeta.track = {no: '0', of: '0'};
    }

    // Convert disk number to string and split in no and of and
    // remove leading 0
    let diskNb = metadata.discnumber || metadata.discnumber;
    if (diskNb) {
      diskNb = (diskNb + '').split('/');
      cleanMeta.disk = {
        'no': (diskNb[0]) ? diskNb[0].replace(/^0+(?=\d)/, '') : '0',
        'of': (diskNb[1]) ? diskNb[1].replace(/^0+(?=\d)/, '') : '0',
      }
    } else {
      cleanMeta.disk = {no: '0', of: '0'};
    }


    // Trim Obj key and value
    cleanMeta = trimObj.trimObj(cleanMeta);

    cb( null , cleanMeta );

  } catch (e) {
    console.log('Error when reading/cleaning tag with taglib2');
    console.trace(e);
    cb( e );
  }
};

/**
 * Extract Picture from a track with taglib2 return a obj with picture
 * buffer and extension of file
 *
 * @param input String path to a audio file
 */
function readPict(filePath , cb) {
  try {
    const metadata = taglib2.readTagsSync(filePath);
    if (metadata && metadata.pictures && metadata.pictures[0]) {
      return cb(
        null,
        {
          pict: metadata.pictures[0].picture,
          ext: metadata.pictures[0].mimetype.split('/')[1]
        }
      )
    }
    cb( null , null );
  } catch (e) {
    cb( e );
  }
}
exports.readPict = readPict;

/**
 * Save cover from tag of an audio file to a jpg file
 *
 * @param input String path to a audio file
 * @param output String path to extracted cover to a jpg file
 * @param cb
 */
exports.readPictAndSave = function (input, output, cb) {

  const saveToJpeg = require('../picture.server.services');

  readPict(input, (err, data) => {
      if (err) return cb(err);
      saveToJpeg.saveToJpeg(data.pict, output, cb)
    }
  );
};

/**
 * Write meta to a file
 *
 * You have to use tracknumber instead of track
 * and discnumber instead of disc
 *
 * Exemple of meta
 * meta = {
 *  artist: 'Howlin\' Wolf',
 *  title: 'Evil is goin\' on',
 *  album: 'Smokestack Lightnin\'',
 *  comment: 'Chess Master Series',
 *  genre: 'blues',
 *  year: 1951,
 *  track: 3,
 *  tracknumber: '1/1',
 *  discnumber: '1/1',
 *   pictures: [
 *    {
 *      "mimetype": mime('./cover.jpg'),
 *      "picture": fs.readFileSync('./cover.jpg')
 *     }
 *   ],
 * };
 *
 *
 * @param audioFile String Path to audio file
 * @param meta Object
 * @param cb
 */
exports.saveMeta = function (audioFile, meta, cb) {

  function standardizeMeta(meta){

    let newMeta = Object.assign({}, meta);

    if (meta.track.no) {
      newMeta.tracknumber = meta.track.no + '/' + meta.track.of;
      delete newMeta.track;
    }

    if (meta.disk.no) {
      newMeta.discnumber = meta.disk.no + '/' + meta.disk.of;
      delete newMeta.disk;
    }

    if (meta.genre) {
      newMeta.genre = meta.genre.join(', ');
    }

    return newMeta;

  }

  try {
    taglib2.writeTagsSync(audioFile, standardizeMeta(meta));
    cb(null);
  } catch (e){
    cb(e);
  }
};
