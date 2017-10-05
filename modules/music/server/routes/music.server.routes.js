/**
 * Created by Dimitri Aguera on 30/09/2017.
 */

const music = require('../controllers/music.server.controllers.js');

module.exports = function(app){

    // Return streamed audio file.
    app.route('/api/music/read').get(music.read);

    // Return all playlist's
    app.route('/api/allPlaylist')
        .get( music.allPlaylist );

    // Create Playlist
    app.route('/api/playlist')
        .post( music.create );

    // Add Tracks
    app.route('/api/addtracks/:title')
        .put( music.addTracks );

    // Unique playlist
    app.route('/api/playlist/:title')
        .get( music.playlist )
        .put( music.update )
        .delete( music.delete );

    app.param('title', music.playlistByTitle);

};
