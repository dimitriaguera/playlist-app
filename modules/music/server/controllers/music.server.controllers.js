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

exports.read = function (req, res, next) {

    // Build absolute path.
    const drive = config.folder_base_url;
    const query = req.query.path;
    const filePath = `${drive}/${query}`;

    // Get stat file.
    fs.stat(filePath, (err, stat) => {

        if ( err ) {
            res.status(404);
            return errorHandler.errorMessageHandler( err, req, res, next, `Can't find file.` );
        }

        // Get buffer to extract MIME from checking magic number of the buffer.
        const buffer = readChunk.sync(filePath, 0, 4100);
        const ft = fileType( buffer );

        // Create response Header.
        res.writeHead(200, {
            'Content-Type': ft.mime,
            'Content-Length': stat.size
        });

        // Create Readable.
        const audio = fs.createReadStream(filePath);

        // Pipe data in server response.
        audio.pipe(res, { end: false });

        res.on('close', () => {
            console.log('CLOSE RESP');
        });

        // Handle error event during stream.
        audio.on( 'error', ( err ) => {
            console.log( err.message );
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

    const { title, user } = req.body;

    const newPl = new Playlist({
        title: title,
        author: user._id,
    });

    newPl.save((err) => {
        if (err) {
            return errorHandler.errorMessageHandler( err, req, res, next );
        }
        res.json({
            success: true,
            msg: 'Successful created new playlist.'
        });
    });
};


exports.playlist = function (req, res) {
    const pl = req.model;
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

    Playlist.find({defaultPlaylist: false})
        .populate('author', 'username')
        .exec(function(err, pls){
        if (err) {
            res.status(422);
            return errorHandler.errorMessageHandler( err, req, res, next, `Can't find playlists.` );
        }

        // If user authenticated, search and add default playlist.
        usersServices.getUserFromToken(req, (user) => {

            if ( user ) {
                return getDefaultPlaylist( user, (err, _defPl) => {
                    if (err) {
                        res.status(422);
                        return errorHandler.errorMessageHandler( err, req, res, next, `Can't find default playlist for user ${req.user.username}` );
                    }

                    if(_defPl) {
                        pls.unshift(_defPl);
                    }

                    res.json({
                        success: true,
                        msg: pls
                    });
                });
            }

            res.json({
                success: true,
                msg: pls
            });
        });
    });
};

exports.addTracks = function (req, res, next) {

    const pl = req.model;

    pl.tracks = pl.tracks.concat(req.body.tracks);

    pl.save( function(err){
        if (err) {
            res.status(422);
            return errorHandler.errorMessageHandler( err, req, res, next );
        }
        res.json({
            success: true,
            msg: pl
        });
    });
};

exports.update = function (req, res, next) {

    const pl = req.model;

    // Update playlist consist on adding or deleting tracks.
    if ( req.body.tracks ) pl.tracks = req.body.tracks;

    pl.save( function(err){
        if (err) {
            res.status(422);
            return errorHandler.errorMessageHandler( err, req, res, next );
        }
        res.json({
            success: true,
            msg: pl
        });
    });
};

exports.delete = function (req, res, next) {
    const pl = req.model;

    if( pl.defaultPlaylist ){
        return res.json({
            success: false,
            msg: 'Can\'t remove default playlist'
        });
    }

    pl.remove(function(err){
        if (err) {
            res.status(422);
            return errorHandler.errorMessageHandler( err, req, res, next );
        }
        res.json({
            success: true,
            msg: pl
        });
    });
};

exports.playlistByTitle = function(req, res, next, title) {

    Playlist.findOne({title: title})
        .populate('author', 'username')
        .exec(function (err, playlist) {
        if (err) {
            return next(err);
        }
        req.model = playlist;
        next();
    });
};


// HELPER
function getDefaultPlaylist ( user, done ) {

    const __def = `__def${user.username}`;

    // Get default playlist for user.
    Playlist.findOne({ title: __def })
        .populate('author', 'username')
        .exec(function(err, pls){
            if (err) {
                return done(err);
            }
            done( null, pls );
        });
};