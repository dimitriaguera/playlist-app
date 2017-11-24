/**
 * Created by Dimitri Aguera on 28/08/2017.
 */
'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const path = require('path');
const config = require(path.resolve('./config/env/config.server'));
const musicTag = require(path.resolve('./modules/music/server/services/readTag/readTag.server.services.js'));
//const socketsEvents = require('../../../../config/sockets/sockets.conf');

/**
 * Node model.
 *
 */
const NodeSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    publicName: String,
    uri: {
        type: String,
        unique: true,
        required: true,
    },
    path: {
        type: String,
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
    meta: Object
});

/**
 * Middleware that remove Node's children.
 * Cascade effect : all children removed call middleware, and remove his own children.
 *
 */
NodeSchema.pre('remove', function(next) {

    const id = this._id;

    // Delete children Nodes.
    Node.find({parent: id}, (err, nodes) => {
        nodes.forEach(function(node) {
            node.remove( (err) => {
                if(err) return next(err);
            });
        });
    });

    console.log(`Remove Index file ${this.path}.`);
    next();
});

// /**
//  * Handle before saving new user queue playlist.
//  *
//  */

NodeSchema.pre('save', function (next) {
    if ( this.isFile ) {
      musicTag.read(this.uri, (err, data) => {
        if (err) {
          console.log('Error when reading meta for : ' + this.path);
          next();
        }
        this.meta = data;
        next();
      });
    } else {
      next();
    }
});

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

const Node = mongoose.model('Node', NodeSchema);
module.exports = Node;