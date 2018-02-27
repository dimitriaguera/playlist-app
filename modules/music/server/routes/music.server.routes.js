/**
 * Created by Dimitri Aguera on 30/09/2017.
 */
'use strict';

const music = require('../controllers/music.server.controllers');
const path = require('path');
const routeStrategy = require(path.resolve('./modules/users/server/config/route.strategy'));

module.exports = function (app) {
  // Return streamed audio file.
  app.route('/api/music/read')
    .all(routeStrategy.needAuthentication)
    .get(music.read);

  // Return playlist's created by user.
  app.route('/api/ownedPlaylist')
    .all(routeStrategy.needAuthentication)
    .get(music.ownedPlaylist);

  // Get all playlist or create a Playlist.
  app.route('/api/playlist')
    .all(routeStrategy.needAuthentication)
    .get(music.allPlaylist)
    .post(music.create);

  // Unique playlist
  app.route('/api/playlist/:title')
    .all(routeStrategy.needAuthentication)
    .get(music.playlist)
    .post(music.addTracks)
    .put(music.update)
    .delete(music.delete);

  app.param('title', music.playlistByTitle);
};
