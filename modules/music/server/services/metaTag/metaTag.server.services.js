/**
 * Created by Marc Foletto on 23/11/2017.
 */
'use strict';

let taglib2, mm, ffmetadata, fs;

try {

  // Js wrap for taglib
  taglib2 = require('taglib2');
  //console.log('Meta music lib used: taglib2');
  exports.read = readWithTagLib2;
  exports.metaLibName = 'taglib2';

} catch(e) {

  try {

    // Pure Js MusicMeta
    mm = require('music-metadata');
    // console.log('Meta music lib used: music-metadata');
    exports.read = musicTiretMetaData;
    exports.metaLibName = 'music-metadata';

  } catch(e) {

    try {
      // ffmetadata = ffmpeg
      ffmetadata = require('ffmetadata');
      //console.log('Meta music lib used: ffmetadata');
      exports.read = readWithFFmetaData;
      exports.metaLibName = 'ffmetadata';
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
  if (!obj) {
    console.log('sa pue');
  }
  if ( !Array.isArray(obj) || typeof obj !== 'object' || !obj ) return obj;

  return Object.keys(obj).reduce(function(acc, key) {
    acc[key.trim()] = typeof obj[key] === 'string' ? obj[key].trim() : trimObj(obj[key]);
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
    cleanMeta = trimObj(cleanMeta);

    cb( null , cleanMeta );

  } catch (e) {
    console.log('Error when reading/cleaning tag with taglib2');
    console.trace(e);
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

        cleanMeta.title = metadata.common.title  || null;
        cleanMeta.artist = metadata.common.artist  || null;
        cleanMeta.album = metadata.common.album  || null;

        // Change date to string
        cleanMeta.year = metadata.common.year ? (metadata.common.year + '') : null;

        // Change time to ms in MM:SS and convert it to string
        if (metadata.format.duration) {
          cleanMeta.time = new Date(metadata.format.duration * 1000).toISOString().substr(11, 8);
          if (cleanMeta.time.substr(0,2) === '00') cleanMeta.time = cleanMeta.time.substr(3, 6);
        } else {
          cleanMeta.time = null;
        }

        // Convert Genre in tab and split well for exemple this case
        // [ 'pop,rock' , 'jazz' ] => [ 'pop', 'rock', 'jazz']
        cleanMeta.genre = metadata.common.genre ? metadata.common.genre.join(', ').split(/\s*[,;\/]\s*/) : [];

        // cleanMeta.albumartist doesn't exist if null empty
        if (metadata.common.albumartist) {
          cleanMeta.albumartist = metadata.common.albumartist;
        }

        // cleanMeta.composer doesn't exist if null empty
        if (metadata.common.composer) {
          cleanMeta.composer = metadata.common.composer.join('/');
        }

        // Forge track field
        if (metadata.common.track) {
          cleanMeta.track = {};
          if (metadata.common.track.no === null) {
            cleanMeta.track.no = '0';
          } else {
            cleanMeta.track.no = (metadata.common.track.no + '').replace(/^0+(?=\d)/, '');
          }
          if (metadata.common.track.of === null) {
            cleanMeta.track.of = '0';
          } else {
            cleanMeta.track.of = (metadata.common.track.of + '').replace(/^0+(?=\d)/, '');
          }
        } else {
          cleanMeta.track = {no: '0', of: '0'};
        }

        // Forge Disk field
        if (metadata.common.disk) {
          cleanMeta.disk = {};
          if (metadata.common.disk.no === null) {
            cleanMeta.disk.no = '0';
          } else {
            cleanMeta.disk.no = (metadata.common.disk.no + '').replace(/^0+(?=\d)/, '');
          }
          if (metadata.common.disk.of === null) {
            cleanMeta.disk.of = '0';
          } else {
            cleanMeta.disk.of = (metadata.common.disk.of + '').replace(/^0+(?=\d)/, '');
          }
        } else {
          cleanMeta.disk = {no: '0', of: '0'};
        }


        // NOT Trim Obj beacause mm already does that

        cb( null , cleanMeta );

      } catch (e) {
        console.log('Error when reading/cleaning tag with mm');
        console.trace(e);
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
