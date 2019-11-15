/**
 * Created by Dimitri Aguera on 28/08/2017.
 */
'use strict';

const JwtStrategy = require('passport-jwt').Strategy,
  ExtractJwt = require('passport-jwt').ExtractJwt,
  path = require('path'),
  config = require(path.resolve('./config/env/config.server')),
  User = require('../models/users.server.models');

module.exports.setStrategy = function(passport) {
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: config.security.jwtSecret
      },

      function(jwt_payload, done) {
        User.findOne({ _id: jwt_payload._id })
          .then(user => (user ? done(null, user) : done(null, false)))
          .catch(err => {
            return done(err, false);
          });
      }
    )
  );
};

module.exports.init = function(app, passport) {
  app.use(passport.initialize());
  this.setStrategy(passport);

  return passport;
};
