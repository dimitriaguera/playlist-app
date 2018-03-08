/**
 * Created by Dimitri Aguera on 30/09/2017.
 */
const fs = require('fs');
const path = require('path');
const config = require(path.resolve('./config/env/config.server'));
const readChunk = require('read-chunk');
const fileType = require('file-type');
const Playlist = require('../models/music.server.models');
const errorHandler = require(path.resolve('./modules/core/server/services/error.server.services'));
const usersServices = require(path.resolve('./modules/users/server/services/users.server.services'));
const ps = require(path.resolve('./modules/core/client/services/core.path.services'));

exports.read = function (req, res, next) {
  // Build absolute path.
  const DRIVE = config.musicFolder;
  const NOT_SECURE_STRING = req.query.path;

  const query = ps.cleanPath(NOT_SECURE_STRING);
  const filePath = `${DRIVE}/${query}`;

  // Only read audi files.
  if (!config.fileSystem.fileAudioTypes.test(filePath)) {
    res.status(404);
    return res.json({
      success: false,
      msg: 'Not authorized audio format.'
    });
  }

  // Get stat file.
  fs.stat(filePath, (err, stat) => {
    if (err) {
      res.status(404);
      return errorHandler.errorMessageHandler(err, req, res, next, `Can't find file.`);
    }

    let audio;

    try {
      // Get buffer to extract MIME from checking magic number of the buffer.
      const buffer = readChunk.sync(filePath, 0, 4100);
      const ft = fileType(buffer);

      const fileSize = stat.size;
      const range = req.headers.range;

      // If range requested in header, make 206 range response server.
      if (range) {
        // Get range start / end.
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1]
          ? parseInt(parts[1], 10)
          : fileSize - 1;

        // Get size of chunk.
        const chunksize = (end - start) + 1;

        // Create stream chunk.
        audio = fs.createReadStream(filePath, {start, end});

        // Make specific header.
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': ft.mime
        };

        // Resp in range mode.
        res.writeHead(206, head);
        audio.pipe(res);
      }

      // If no range request, 200 response.
      else {
        // Create response Header.
        res.writeHead(200, {
          'Content-Type': ft.mime,
          'Content-Length': fileSize
        });

        // Create Readable.
        audio = fs.createReadStream(filePath);

        // Pipe data in server response.
        audio.pipe(res, { end: false });
      }
    }
    catch (err) {
      // res.status(500);
      return next(err);
    }


    res.on('close', () => {
      console.log('CLOSE RESP');
    });

    // Handle error event during stream.
    audio.on('error', (err) => {
      console.log(err.message);
      res.end('Goodbye');
    });

    // Handle close event.
    audio.on('close', () => {
      console.log('CLOSE EVENT');
      res.end('Goodbye');
    });

    // Handle end event.
    audio.on('end', () => {
      console.log('END EVENT');
      res.end('Goodbye');
    });
  });
};

exports.create = function (req, res, next) {
  const { title, user, tracks = [] } = req.body;

  // Create playlist.
  const newPl = new Playlist({
    title: title,
    author: user._id,
    tracks: tracks
  });

    // Save it.
  newPl.save((err) => {
    if (err) {
      if (err.name === 'MongoError' && err.code === 11000) {
        res.status(202);
        return errorHandler.errorMessageHandler(err, req, res, next, `${title} already exist. Please choose an other playlist title.`);
      }
      return errorHandler.errorMessageHandler(err, req, res, next);
    }
    res.json({
      success: true,
      msg: 'Successful created new playlist.'
    });
  });
};


exports.playlist = function (req, res) {
  // Get playlist.
  const pl = req.model;

  // Send it.
  if (!pl) {
    return res.status(401).json({
      success: false,
      msg: 'Playlist no found'});
  }
  res.json({
    success: true,
    msg: pl
  });
};

exports.allPlaylist = function (req, res, next) {
  // Search all playlist, without defaults playlists.
  Playlist.find({defaultPlaylist: false})
    .populate('author', 'username -_id')
    .select('-tracks -_id')
    .exec(function (err, pls) {
      if (err) {
        res.status(422);
        return errorHandler.errorMessageHandler(err, req, res, next, `Can't find playlists.`);
      }

      // If user authenticated, search and add default playlist.
      usersServices.getUserFromToken(req, (user) => {
        // If authenticated.
        if (user) {
          // Get the default playlist of this user.
          return getDefaultPlaylist(user, (err, _defPl) => {
            if (err) {
              res.status(422);
              return errorHandler.errorMessageHandler(err, req, res, next, `Can't find default playlist for user ${user.username}`);
            }

            // User has default playlist, add it to all playlist.
            if (_defPl) {
              pls.unshift(_defPl);
            }

            // Send all.
            res.json({
              success: true,
              msg: pls
            });
          });
        }

        // If no authenticated, send all without default playlist.
        res.json({
          success: true,
          msg: pls
        });
      });
    });
};

exports.ownedPlaylist = function (req, res, next) {
  // Passport middleware authenticated road, so req.user must exist.
  const user = req.user;

  // If user authenticated, search playlist he creates.
  if (user) {
    return Playlist.find({ defaultPlaylist: false, author: user._id })
      .populate('author', 'username -_id')
      .select('-tracks -_id')
      .exec(function (err, pls) {
        if (err) {
          res.status(422);
          return errorHandler.errorMessageHandler(err, req, res, next, `Can't find owned playlists.`);
        }

        // Get the default playlist of this user.
        getDefaultPlaylist(user, (err, _defPl) => {
          if (err) {
            res.status(422);
            return errorHandler.errorMessageHandler(err, req, res, next, `Can't find default playlist for user ${user.username}`);
          }

          // User has default playlist, add it to all playlist.
          if (_defPl) {
            pls.unshift(_defPl);
          }

          // Send all.
          res.json({
            success: true,
            msg: pls
          });
        });
      });
  }

  // If no authenticated, bye.
  res.status(401);
  return res.json({
    success: false,
    msg: 'Not authorized.'
  });
};

exports.addTracks = function (req, res, next) {
  // Get concerned playlist.
  const pl = req.model;

  // Passport middleware authenticated road, so req.user must exist.
  const user = req.user;

  // If authenticated user is not the author, bye.
  if (pl.populated('author').toJSON() !== user._id.toJSON()) {
    res.status(401);
    return res.json({
      success: false,
      msg: 'Not authorized.'
    });
  }

  // @todo regexer les entrées DB pour enlever les scripts. ).

  // Just add tracks from body post request.
  pl.tracks = pl.tracks.concat(req.body.tracks);

  // Save on db.
  pl.save(function (err) {
    if (err) {
      res.status(422);
      return errorHandler.errorMessageHandler(err, req, res, next);
    }
    res.json({
      success: true,
      msg: pl
    });
  });
};

exports.update = function (req, res, next) {
  // Get concerned playlist.
  const pl = req.model;

  // Passport middleware authenticated road, so req.user must exist.
  const user = req.user;

  // If authenticated user is not the author, bye.
  if (pl.populated('author').toJSON() !== user._id.toJSON()) {
    res.status(401);
    return res.json({
      success: false,
      msg: 'Not authorized.'
    });
  }

  // Update playlist consist on adding or deleting tracks.
  if (req.body.tracks) pl.tracks = req.body.tracks;

  // Save on db.
  pl.save(function (err) {
    if (err) {
      res.status(422);
      return errorHandler.errorMessageHandler(err, req, res, next);
    }
    res.json({
      success: true,
      msg: pl
    });
  });
};

exports.delete = function (req, res, next) {
  // Get playlist.
  const pl = req.model;

  // Passport middleware authenticated road, so req.user must exist.
  const user = req.user;

  // Verify if not a default playlist.
  // Default playlist must not be deleted by this way.
  if (pl.defaultPlaylist) {
    return res.json({
      success: false,
      msg: 'Can\'t remove default playlist'
    });
  }

  // If authenticated user is not the author, bye.
  if (pl.populated('author').toJSON() !== user._id.toJSON()) {
    res.status(401);
    return res.json({
      success: false,
      msg: 'Not authorized.'
    });
  }

  // Remove playlist.
  // Then, send deleted playlist ( useful to update states on client side )
  pl.remove(function (err) {
    if (err) {
      res.status(422);
      return errorHandler.errorMessageHandler(err, req, res, next);
    }
    res.json({
      success: true,
      msg: pl
    });
  });
};

exports.playlistByTitle = function (req, res, next, title) {
  // Find an store a playlist.
  Playlist.findOne({title: title})
    .populate('tracks')
    .populate('author', 'username -_id')
    .exec(function (err, playlist) {
      if (err) {
        return next(err);
      }
      req.model = playlist;
      next();
    });
};


// HELPER
function getDefaultPlaylist (user, done) {
  // Build default playlist name according to user's username.
  const __def = `__def${user.username}`;

  // Get default playlist for user.
  Playlist.findOne({ title: __def })
  // .populate('tracks')
    .populate('author', 'username -_id')
    .select('-tracks -_id')
    .exec(function (err, pls) {
      if (err) {
        return done(err);
      }

      done(null, pls);
    });
}
exports.getDefaultPlaylist = getDefaultPlaylist;
