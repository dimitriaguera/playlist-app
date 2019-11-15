/**
 * Created by Dimitri Aguera on 28/08/2017.
 */
'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaskSchema = new Schema({
  memId: {
    type: String
  },

  key: {
    type: String
  },

  unique: {
    type: Boolean
  },

  status: {
    type: String
  },

  created: {
    type: Date
  },

  ended: {
    type: Date
  },

  body: {
    type: Schema.Types.Mixed
  }
});

module.exports = mongoose.model('TaskDb', TaskSchema);
