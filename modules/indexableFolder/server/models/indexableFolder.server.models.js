/**
 * Created by Dimitri Aguera on 28/08/2017.
 */
'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const path = require('path');
const config = require(path.resolve('./config/env/config.server'));

//const socketsEvents = require('../../../../config/sockets/sockets.conf');

/**
 * Node model.
 *
 */
const NodeSchema = new Schema({
    name: String,
    path: {
        type: String,
        required: true,
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: 'Node'
    },
    children: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Node'
        }
    ],
    isFile: {
        type: Boolean,
        default: false,
    },
    meta: []
});

// /**
//  * Handle before saving new user queue playlist.
//  *
//  */
// NodeSchema.pre('save', function (next) {
//     if ( this.isNew && this.defaultPlaylist ) {
//         this.publicTitle = this.title.replace('__def', 'Queue - ');
//     }
//     return next();
// });
//
// /**
//  * Handle for sockets.
//  *
//  */
// NodeSchema.post('save', function( doc ) {
//     console.log('save post middleware called on Playlist Model');
//     doc.populate({
//         path: 'author',
//         select: 'username -_id',
//     }, (e, popDoc) => {
//         if( e ) {
//             return socketsEvents.emit( 'save:playlist', doc );
//         }
//         socketsEvents.emit( 'save:playlist', popDoc );
//     });
// });

module.exports = mongoose.model('Node', NodeSchema);