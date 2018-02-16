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
  path: {
    type: String,
    required: true
  },
  meta: []
});

const PlaylistSchema = new Schema({
  title: {
    type: String,
    unique: true,
    required: true
  },
  tracks: [{
    type: Schema.Types.ObjectId,
    ref: 'Node'
  }],
  tracksFiles: [TrackSchema],
  length: {
    type: Number,
    default: 0
  },
  created: {
    type: Date,
    default: Date.now
  },
  defaultPlaylist: {
    type: Boolean,
    default: false
  },
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  publicTitle: {
    type: String
  }
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});

/**
 * Handle before saving new user queue playlist.
 *
 */
PlaylistSchema.pre('save', function (next) {
  this.length = this.tracks.length;

  if (this.isNew && this.defaultPlaylist) {
    this.publicTitle = this.title.replace('__def', 'Queue - ');
  }
  return next();
});

/**
 * Handle for sockets.
 *
 */
PlaylistSchema.post('save', function (doc) {
  console.log('save post middleware called on Playlist Model');
  doc
    .populate('tracks')
    .populate({
      path: 'author',
      select: 'username -_id'
    }, (e, popDoc) => {
      if (e) {
        return socketsEvents.emit('save:playlist', doc);
      }
      socketsEvents.emit('save:playlist', popDoc);
    });
});

module.exports = mongoose.model('Playlist', PlaylistSchema);
