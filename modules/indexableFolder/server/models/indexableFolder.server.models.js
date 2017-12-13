/**
 * Created by Dimitri Aguera on 28/08/2017.
 */
'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const path = require('path');
const metaTag = require(path.resolve('./modules/music/server/services/metaTag/metaTag.server.services.js'));

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
    meta: {
      type: Schema.Types.Mixed
    }
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

/**
 * Handle before saving new node.
 * If node is file, extract metadata.
 *
 */
NodeSchema.pre('save', function (next) {
    if ( this.isFile ) {
        metaTag.read(this.uri, (err, data) => {
            if (err) {
              console.log('Error when reading meta for : ' + this.path);
              next();
            }
            this.meta = data;
            next();
        });
    }
    else {
        next();
    }
});


NodeSchema.post('save', function() {
  console.log('Save : ' + this.path);
});


const Node = mongoose.model('Node', NodeSchema);
module.exports = Node;