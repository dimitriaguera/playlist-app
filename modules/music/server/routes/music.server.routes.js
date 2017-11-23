/**
 * Created by Dimitri Aguera on 30/09/2017.
 */
'use strict';

const music = require('../controllers/music.server.controllers.js');
const path = require('path');
const passport = require('passport');
const authorizeRoles = require(path.resolve('./modules/users/server/roles/route.role.authorize'));
const { USER_ROLE } = require(path.resolve('./modules/users/commons/roles'));

module.exports = function(app){

    // Return streamed audio file.
    app.route('/api/music/read')
        .get(music.read);

    // Return playlist's created by user.
    app.route('/api/ownedPlaylist').all(passport.authenticate('jwt', { session: false }), authorizeRoles(USER_ROLE))
        .get( music.ownedPlaylist );

    // Get all playlist or create a Playlist.
    app.route('/api/playlist')
        .get( music.allPlaylist ).all(passport.authenticate('jwt', { session: false }), authorizeRoles(USER_ROLE))
        .post( music.create );

    // Unique playlist
    app.route('/api/playlist/:title')
        .get( music.playlist ).all(passport.authenticate('jwt', { session: false }), authorizeRoles(USER_ROLE))
        .post( music.addTracks )
        .put( music.update )
        .delete( music.delete );

    app.param('title', music.playlistByTitle);

};
