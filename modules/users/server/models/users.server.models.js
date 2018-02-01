/**
 * Created by Dimitri Aguera on 28/08/2017.
 */
'use strict';

const chalk = require('chalk');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Promise = require('bluebird');
const path = require('path');
const config = require(path.resolve('./config/env/config.server'));

const socketsEvents = require('../../../../config/sockets/sockets.conf');

let bcrypt;
try {
  bcrypt = require('bcrypt');
  console.log(chalk.blue('bcrypt'));
}
catch (e) {
  bcrypt = require('bcryptjs');
  console.log(chalk.red('bcryptjs : If authentification is slow (e.g. on Raspberry) install Bcrypt instead of Bcryptjs'));
}


/**
 * From MEAN JS.
 * A Validation function for username
 * - at least 3 characters
 * - only a-z0-9_-.
 * - contain at least one alphanumeric character
 * - not in list of illegal usernames
 * - no consecutive dots: "." ok, ".." nope
 * - not begin or end with "."
 */

const validateUsername = function (username) {
  const usernameRegex = /^(?=[\w.-]+$)(?!.*[._-]{2})(?!\.)(?!.*\.$).{3,34}$/;
  return (username && usernameRegex.test(username) && config.security.illegalUsernames.indexOf(username) < 0);
};

/**
 * User model.
 *
 */
const UserSchema = new Schema({

  username: {
    type: String,
    unique: true,
    required: true,
    validate: [validateUsername, 'Please enter a valid username: 3+ characters long, non restricted word, characters "_-.", no consecutive dots, does not begin or end with dots, letters a-z and numbers 0-9.']
  },

  password: {
    type: String,
    required: true
  },

  roles: ['string'],

  updated: {
    type: Date
  },

  created: {
    type: Date,
    default: Date.now
  }
});


/**
 * Handle before saving to threat password.
 *
 */
UserSchema.pre('save', function (next) {
  const user = this;
  console.log('Debut Hash');
  if (this.isModified('password') || this.isNew) {
    bcrypt.hash(user.password, 8, (err, hash) => {
      if (err) {
        console.log('Error on Hash');
        return next(err);
      }
      console.log('Fin Hash');
      user.password = hash;
      next();
    });
  } else {
    return next();
  }
});

/**
 * Handle for sockets.
 *
 */
UserSchema.post('save', function (doc) {
  console.log('save post middleware called on User Model');
  socketsEvents.emit('save:user', doc);
});

UserSchema.method('comparePassword', function (password) {
  const self = this;

  console.log('Debut Check Pass');

  return new Promise(function (resolve, reject) {
    bcrypt.compare(password, self.password,
      (err, res) => {
        if (err) {
          return reject(err)
        }

        console.log('Fin Check Pass');
        resolve(res);
      });
  });
});

UserSchema.method('secure', function () {
  const other = this.toObject();
  delete other.password;
  return other;
});

module.exports = mongoose.model('User', UserSchema);
