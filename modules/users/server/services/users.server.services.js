/**
 * Created by Dimitri on 16/10/2017.
 */
'use strict';
const jwt = require('jsonwebtoken');
const path = require('path');
const config = require(path.resolve('./config/env/config.server'));

exports.getToken = function(headers) {
  if (headers && headers.authorization) {
    // Extract token from headers.
    let token = headers.authorization;

    // Extract 'BEARER ' from token.
    let extractedToken = token.substr(7);
    return extractedToken;
  }
  return null;
};

exports.getUserFromToken = function(req, done) {
  let token = this.getToken(req.headers);

  if (token) {
    // Test token validity.
    jwt.verify(token, config.security.jwtSecret, function(err, jwt_payload) {
      // If error, return.
      if (err) {
        return done(null);
      }

      // Else, return decoded.
      return done(jwt_payload);
    });
  } else {
    return done(null);
  }
};
