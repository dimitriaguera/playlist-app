/**
 * Created by Marc Foletto on 23/11/2017.
 */
'use strict';

let taglib2, mm, ffmetadata, fs;

try {
  // Js wrap for taglib
  taglib2 = require('taglib2');
  exports.read = readWithTagLib2;

} catch(e) {

  try {
    // Pure Js MusicMeta
    mm = require('music-metadata');
    exports.read = musicTiretMetaData;

  } catch(e) {

    try {
      // ffmetadata = ffmpeg
      ffmetadata = require('ffmetadata');
      exports.read = readWithFFmetaData;
    } catch(e) {
      console.error('No lib for reading meta');
    }

  }

}

/**
 * Trim obj and key of an obj in deep
 * @param obj
 * @returns {*}
 */
function trimObj(obj) {

  if (!Array.isArray(obj) && typeof obj !== 'object') return obj;

  return Object.keys(obj).reduce(function(acc, key) {
    acc[key.trim()] = typeof obj[key] === 'string'? obj[key].trim() : trimObj(obj[key]);
    return acc;
  }, Array.isArray(obj)? []:{});

}


/**
 * Read Tag With TagLib2
 * @param filePath
 * @param cb
 */
function readWithTagLib2(filePath , cb) {
  try {
    let metadata = taglib2.readTagsSync(filePath);

    let cleanMeta = {};

    cleanMeta.title = metadata.title  || '';
    cleanMeta.artist = metadata.artist  || '';
    cleanMeta.album = metadata.album  || '';

    cleanMeta.year = metadata.year;
    cleanMeta.year = cleanMeta.year + '';

    cleanMeta.time = metadata.time || '';

    cleanMeta.genre = metadata.genre || '';
    cleanMeta.genre = cleanMeta.genre.split(/\s*[,;\/]\s*/);

    if (metadata.albumartist) cleanMeta.albumartist = metadata.albumartist;
    if (metadata.composer) cleanMeta.composer = metadata.composer;

    let trackNb = metadata.tracknumber || metadata.track || '0';
    trackNb = trackNb + '';
    trackNb = trackNb.split('/');
    if (trackNb){
      cleanMeta.track = {
        'no': (trackNb[0]) ? trackNb[0].replace(/^0+(?=\d)/, '') : '0',
        'of': (trackNb[1]) ? trackNb[1].replace(/^0+(?=\d)/, '') : '0',
      }
    }

    let diskNb = metadata.discnumber || metadata.disc || '0';
    diskNb = diskNb + '';
    diskNb = diskNb.split('/');
    if (diskNb){
      cleanMeta.disk = {
        'no': (diskNb[0]) ? diskNb[0].replace(/^0+(?=\d)/, '') : '0',
        'of': (diskNb[1]) ? diskNb[1].replace(/^0+(?=\d)/, '') : '0',
      }
    }

    // Trim Obj
    cleanMeta = trimObj(cleanMeta);

    cb( null , cleanMeta );

  } catch (e) {
    console.error('Error when reading/cleaning tag with taglib2');
    cb( e );
  }
}


/**
 * Read Tag With music-metadata
 * @param track
 * @param cb
 */
function musicTiretMetaData(track, cb) {

  mm.parseFile(track,
    {
      native: false,
      duration: true,
      skipCovers: true
    }
  )
    .then(function (metadata) {

      try{

        let cleanMeta = {};

        cleanMeta.title = metadata.common.title  || '';
        cleanMeta.artist = metadata.common.artist  || '';
        cleanMeta.album = metadata.common.album  || '';

        cleanMeta.year = metadata.year || '';
        cleanMeta.year = cleanMeta.year + '';

        cleanMeta.time = metadata.format.duration || '';
        if (cleanMeta.time) cleanMeta.time = new Date(cleanMeta.time * 1000).toISOString().substr(11, 8);
        if (cleanMeta.time.substr(0,2) == '00') cleanMeta.time = cleanMeta.time.substr(3, 6);

        cleanMeta.genre = metadata.common.genre || [];
        cleanMeta.genre = cleanMeta.genre.join(', ').split(/\s*[,;\/]\s*/);

        if (metadata.albumartist) {
          cleanMeta.albumartist = metadata.common.albumartist;
        }

        if (metadata.common.composer && metadata.common.composer.join('/')) {
          cleanMeta.composer = metadata.common.composer.join('/');
        }

        cleanMeta.track = metadata.common.track || {'no': '0', 'of': '0'};
        if (cleanMeta.track.no === null) {
          cleanMeta.track.no = '0';
        } else {
          cleanMeta.track.no = (cleanMeta.track.no + '').replace(/^0+(?=\d)/, '');
        }
        if (cleanMeta.track.of === null) {
          cleanMeta.track.of = '0';
        } else {
          cleanMeta.track.of = (cleanMeta.track.of + '').replace(/^0+(?=\d)/, '');
        }

        cleanMeta.disk = metadata.common.disk || {'no': '0', 'of': '0'};
        if (cleanMeta.disk.no === null) {
          cleanMeta.disk.no = '0';
        } else {
          cleanMeta.disk.no = (cleanMeta.disk.no + '').replace(/^0+(?=\d)/, '');
        }
        if (cleanMeta.disk.of === null) {
          cleanMeta.disk.of = '0';
        } else {
          cleanMeta.disk.of = (cleanMeta.disk.of + '').replace(/^0+(?=\d)/, '');
        }

        // Trim Obj NOT NECESSARY LIB DO THAT
        // cleanMeta = trimObj(cleanMeta);

        cb( null , cleanMeta );

      } catch (e) {
        console.error('Error when cleaning tag with mm');
        cb( e );
      }


    })
    .catch(function (err) {
      cb(err);
    });
}


/**
 * Read Tag with FFmpeg
 * @var path = string
 *
 */
function readWithFFmetaData (filePath, cb) {
    ffmetadata.read(filePath, function(err, metadata) {
      if(err) return cb( err );

      try {

        let cleanMeta = {};

        cleanMeta.title = metadata.title || metadata.title || '';
        cleanMeta.artist = metadata.artist || metadata.ARTIST || '';
        cleanMeta.album = metadata.album || metadata.ALBUM || '';

        cleanMeta.year = metadata.date || metadata.DATE || metadata.year || metadata['WM/Year'] || '';
        cleanMeta.year = cleanMeta.year + '';

        cleanMeta.time = metadata.time || '';

        cleanMeta.genre = metadata.genre || metadata.GENRE || '';
        cleanMeta.genre = cleanMeta.genre.split(/\s*[,;\/]\s*/);

        cleanMeta.albumartist = metadata.albumartist || metadata.ALBUMARTIST || metadata.album_artist || metadata.ALBUM_ARTIST || '';
        if (!cleanMeta.albumartist) delete cleanMeta.albumartist;

        cleanMeta.composer = metadata.composer || metadata.COMPOSER || '';
        if (!cleanMeta.composer) delete cleanMeta.composer;


        let trackNb = metadata.track || metadata.TRACK || metadata.tracknumber || metadata.TRACKNUMBER || '0' ;
        let trackOf = metadata.TRACKTOTAL || metadata.tracktotal || metadata.TOTALTRACK || metadata.totaltrack || '0';
        trackOf = trackOf + '';
        trackOf = trackOf.replace(/^0+(?=\d)/, '');
        trackNb = trackNb + '';
        trackNb = trackNb.split('/');
        if (trackNb){
          cleanMeta.track = {
            'no': (trackNb[0]) ? trackNb[0].replace(/^0+(?=\d)/, '') : '0',
            'of': (trackNb[1]) ? trackNb[1].replace(/^0+(?=\d)/, '') : trackOf
          }
        }


        let diskNb = metadata.disc || metadata.DISC || metadata.discnumber || metadata.DISCNUMBER || '0' ;
        let diskOf = metadata.discTOTAL || metadata.disctotal || metadata.TOTALdisc || metadata.totaldisc || '0';
        diskOf = diskOf + '';
        diskOf = diskOf.replace(/^0+(?=\d)/, '');
        diskNb = diskNb + '';
        diskNb = diskNb.split('/');
        if (diskNb){
          cleanMeta.disk = {
            'no': (diskNb[0]) ? diskNb[0].replace(/^0+(?=\d)/, '') : '0',
            'of': (diskNb[1]) ? diskNb[1].replace(/^0+(?=\d)/, '') : diskOf
          }
        }

        cleanMeta = trimObj(cleanMeta);

        cb( null, cleanMeta );

      } catch (e) {

        console.error('Error when cleaning tag with FFmetaData');
        cb( e );

      }

    });
}


/**
 * Write meta Tag to a File with FFmpeg
 *
 * @var path = string
 * @var data = JSON
 * @var cover path to jpeg file
 *
 */
function writeFFmetaData(filePath, metadata, cover, cb){
  ffmetadata.write(filePath, metadata, {attachements: cover}, function(err) {
    if(err) return cb( err );

    cb( null, metadata );
  });

}
