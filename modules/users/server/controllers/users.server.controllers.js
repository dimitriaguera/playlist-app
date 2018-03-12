/**
 * Created by Dimitri Aguera on 28/08/2017.
 */
'use strict';

const User = require('../models/users.server.models');
const mongoose = require('mongoose');
const Promise = require('bluebird');
const jwt = require('jsonwebtoken');
const path = require('path');
const config = require(path.resolve('./config/env/config.server'));
const errorHandler = require(path.resolve('./modules/core/server/services/error.server.services'));
const _ = require('lodash');

// AddExt
const Playlist = require(path.resolve('./modules/music/server/models/music.server.models'));
const musicCtrl = require(path.resolve('./modules/music/server/controllers/music.server.controllers'));
// End AddExt

exports.login = function (req, res, next) {
  const { username, password } = req.body;

  Promise.coroutine(function * () {
    const user = yield User.findOne({username: username});

    if (!user) {
      res.json({
        success: false,
        msg: 'Authentication failed'
      });
    }

    const isValidPwd = yield user.comparePassword(password);
    if (isValidPwd) {
      const secureUser = user.secure();
      const token = jwt.sign(secureUser, config.security.jwtSecret, {expiresIn: config.session.maxAgeToken});

      // AddExt. If login success, search user's default playlist.
      musicCtrl.getDefaultPlaylist(user, (err, _defPl) => {
        if (err) {
          res.status(422);
          return errorHandler.errorMessageHandler(err, req, res, next, `Can't find default playlist for user ${user.username}`);
        }

        // Send all.
        res.json({
          success: true,
          msg: {
            user: secureUser,
            token: `BEARER ${token}`,
            defaultPlaylist: _defPl
          }
        });
      });
      // End AddExt
    } else {
      res.json({
        success: false,
        msg: 'Authentication failed. Wrong User or Password.'
      });
    }
  })().catch(err => console.log(err));
};


exports.register = function (req, res, next) {
  const {username, password, cfPassword, roles} = req.body;

  if (!username || !password || !cfPassword) {
    res.json({
      success: false,
      msg: 'You must give a Username, password and confirmation password.'
    });
  } else if (password !== cfPassword) {
    res.json({
      success: false,
      msg: 'Your password and confirmation password do not match.'
    });
  } else {// Build user.
    const newUser = new User({
      username: username,
      password: password,
      roles: roles
    });

    // Save user.
    newUser.save(function (err, savedUser) {
      if (err) {
        if (err.name === 'MongoError' && err.code === 11000) {
          res.status(202);
          return errorHandler.errorMessageHandler(err, req, res, next, `${username} already exist. Please choose an other account name.`);
        } else if (err.name === 'ValidationError') {
          let tmpMessage = '', fieldError;
          for (fieldError in err.errors) {
            tmpMessage +=  err.errors[fieldError].message + '\n';
          }
          res.status(202);
          return errorHandler.errorMessageHandler(err, req, res, next, tmpMessage);
        }
        return errorHandler.errorMessageHandler(err, req, res, next);
      }

      // If success build default playlist.
      const defPl = new Playlist({
        title: `__def${username}`,
        defaultPlaylist: true,
        author: savedUser._id
      });

      // Save default playlist.
      defPl.save(function (err) {
        if (err) {
          return errorHandler.errorMessageHandler(err, req, res, next);
        }

        // If success send message.
        res.json({
          success: true,
          msg: 'Successful created new user.'
        });
      });
    });
  }
};

exports.users = function (req, res, next) {
  User.find({}, '-password').exec(function (err, users) {
    if (err) {
      res.status(422);
      return errorHandler.errorMessageHandler(err, req, res, next);
    }
    res.json({
      success: true,
      msg: users
    });
  });
};

exports.user = function (req, res) {
  const user = req.model;

  if (!user) {
    return res.status(401).json({
      success: false,
      msg: 'User no found'});
  }
  res.json({
    success: true,
    msg: user
  });
};

exports.account = function (req, res) {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      msg: 'Account not found'
    });
  }
  res.json({
    success: true,
    msg: user.secure()
  });
};

exports.update = function (req, res, next) {
  const user = req.model;

  // Store date update.
  user.updated = Date.now();

  // Here specify fields to update.
  if (req.body.roles) user.roles = req.body.roles;

  user.save(function (err) {
    if (err) {
      res.status(422);
      return errorHandler.errorMessageHandler(err, req, res, next);
    }
    res.json({
      success: true,
      msg: user
    });
  });
};

exports.delete = function (req, res, next) {
  const user = req.model;

  user.remove(function (err) {
    if (err) {
      res.status(422);
      return errorHandler.errorMessageHandler(err, req, res, next);
    }
    res.json({
      success: true,
      msg: user
    });
  });
};

exports.userByName = function (req, res, next, name) {
  User.findOne({username: name}, '-password').exec(function (err, user) {
    if (err) {
      return next(err);
    }

    req.model = user;
    next();
  });
};
