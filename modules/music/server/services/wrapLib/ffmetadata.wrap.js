/**
 * Created by Marc Foletto on 18/12/2017.
 */

const ffmetadata = require('ffmetadata');
const trimObj = require('../../../../core/server/services/obj.server.services');

const fs = require('fs');
const config = require('../../../../../config/env/config.server');

// Check ffmpeg
if ( !process.env.FFMPEG_PATH ) {
  if ( config.ffmpegExec ) {
    process.env.FFMPEG_PATH = config.ffmpegExec;
  } else {
    process.env.FFMPEG_PATH = 'ffmpeg';
  }
}
fs.accessSync(process.env.FFMPEG_PATH, fs.constants.X_OK);


/**
 * Read Tag with FFmpeg
 * @var path = string
 *
 */
exports.read = function read (filePath, cb) {
  ffmetadata.read(filePath, function(err, metadata) {
    if(err) return cb( err );

    try {

      let cleanMeta = {};

      cleanMeta.title = metadata.title || metadata.title || null;
      cleanMeta.artist = metadata.artist || metadata.ARTIST || null;
      cleanMeta.album = metadata.album || metadata.ALBUM || null;

      cleanMeta.year = metadata.date || metadata.DATE || metadata.year || metadata['WM/Year'] || null;
      cleanMeta.year = cleanMeta.year ? (cleanMeta.year + '') : null;

      // Convert time to string
      // @todo format detection and conversion
      cleanMeta.time = metadata.time ? (cleanMeta.time + '') : null;

      // Convert Genre to array
      cleanMeta.genre = metadata.genre || metadata.GENRE;
      cleanMeta.genre = cleanMeta.genre ? cleanMeta.genre.split(/\s*[,;\/]\s*/) : [];

      cleanMeta.albumartist = metadata.albumartist || metadata.ALBUMARTIST || metadata.album_artist || metadata.ALBUM_ARTIST;
      if (!cleanMeta.albumartist) delete cleanMeta.albumartist;

      cleanMeta.composer = metadata.composer || metadata.COMPOSER;
      if (!cleanMeta.composer) delete cleanMeta.composer;


      // Convert track number and TRACKTOTAL or TOTALTRACK to string and split in no and of and
      // remove leading 0
      let trackNb = metadata.track || metadata.TRACK || metadata.tracknumber || metadata.TRACKNUMBER || '0' ;
      trackNb = (trackNb + '').split('/');
      let trackOf = metadata.TRACKTOTAL || metadata.tracktotal || metadata.TOTALTRACK || metadata.totaltrack || '0';
      trackOf = (trackOf + '').replace(/^0+(?=\d)/, '');
      cleanMeta.track = {
        'no': (trackNb[0]) ? trackNb[0].replace(/^0+(?=\d)/, '') : '0',
        'of': (trackNb[1]) ? trackNb[1].replace(/^0+(?=\d)/, '') : trackOf
      };

      // Convert disc number to string and split in no and of and
      // remove leading 0
      let diskNb = metadata.disc || metadata.DISC || metadata.discnumber || metadata.DISCNUMBER || '0' ;
      diskNb = (diskNb + '').split('/');
      let diskOf = metadata.discTOTAL || metadata.disctotal || metadata.TOTALdisc || metadata.totaldisc || '0';
      diskOf = (diskOf + '').replace(/^0+(?=\d)/, '');
      cleanMeta.disk = {
        'no': (diskNb[0]) ? diskNb[0].replace(/^0+(?=\d)/, '') : '0',
        'of': (diskNb[1]) ? diskNb[1].replace(/^0+(?=\d)/, '') : diskOf
      };

      cleanMeta = trimObj.trimObj(cleanMeta);

      cb( null, cleanMeta );

    } catch (e) {

      console.error('Error when cleaning tag with FFmetaData');
      cb( e );

    }

  });
};


/**
 * Write meta Tag to a File with FFmpeg
 *
 * @var path = string
 * @var data = JSON
 * @var cover path to jpeg file
 *
 */
// exports.write = function write(filePath, metadata, cover, cb){
//   ffmetadata.write(filePath, metadata, {attachements: cover}, function(err) {
//     if(err) return cb( err );
//
//     cb( null, metadata );
//   });
// };
