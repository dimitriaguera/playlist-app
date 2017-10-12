/**
 * Created by Dimitri Aguera on 28/08/2017.
 */
'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const path = require('path');
const config = require(path.resolve('./config/env/config.server'));

const socketsEvents = require('../../../../config/sockets/sockets.conf');

/**
 * Playlist model.
 *
 */
const TrackSchema = new Schema({
    name: String,
    src: {
        type: String,
        required: true,
    },
    meta: []
});

const PlaylistSchema = new Schema ({

    title: {
        type: String,
        unique: true,
        required: true,
    },

    tracks: [TrackSchema],

    created: {
        type: Date,
        default: Date.now
    },
    author: { type: Schema.Types.ObjectId, ref: 'User' }
});

/**
 * Handle for sockets.
 *
 */
PlaylistSchema.post('save', function( doc ) {
    console.log('save post middleware called on Playlist Model');
    socketsEvents.emit( 'save:playlist', doc );
});

/**
 * Handle save errors.
 *
 */
PlaylistSchema.post('save', function( err, doc, next ) {

    if ( err.name === 'MongoError' && err.code === 11000 ) {
        next(new Error( `${doc.title} already exist. Please choose an other playlist title.`));
    }

    else {
        next( err );
    }
});


module.exports = mongoose.model('Playlist', PlaylistSchema);