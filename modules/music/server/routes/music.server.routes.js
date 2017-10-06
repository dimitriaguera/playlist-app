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
    app.route('/api/music/read').get(music.read);

    // Return all playlist's
    app.route('/api/allPlaylist')
        .get( music.allPlaylist );

    // Create Playlist
    app.route('/api/playlist').all(passport.authenticate('jwt', { session: false }), authorizeRoles(USER_ROLE))
        .post( music.create );

    // Add Tracks
    app.route('/api/addtracks/:title').all(passport.authenticate('jwt', { session: false }), authorizeRoles(USER_ROLE))
        .put( music.addTracks );

    // Unique playlist
    app.route('/api/playlist/:title')
        .get( music.playlist ).all(passport.authenticate('jwt', { session: false }), authorizeRoles(USER_ROLE))
        .put( music.update )
        .delete( music.delete );

    app.param('title', music.playlistByTitle);

};
