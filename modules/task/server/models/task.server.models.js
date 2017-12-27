/**
 * Created by Dimitri Aguera on 28/08/2017.
 */
'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const path = require('path');
const config = require(path.resolve('./config/env/config.server'));

const TaskSchema = new Schema ({

    name: {
        type: String,
        required: true,
    },

    unique: {
        type: Boolean,
        default: true,
    },

    status: {
        type: String,
        enum: ['pending', 'rejected', 'done'],
        default: 'pending',
    },

    created: {
        type: Date,
        default: Date.now
    },

    ended: {
        type: Date
    },

    body: {
        type: Schema.Types.Mixed
    }
});

module.exports = mongoose.model('Task', TaskSchema);