/**
 * Created by Dimitri Aguera on 28/08/2017.
 */
'use strict';
const jwt = require('jsonwebtoken');
const authorizedRoles = require('../roles/socket.role.authorize');
const path = require('path');
const config = require(path.resolve('./config/env/config.server'));
const User = require('../models/users.server.models');

module.exports = function ( ...roles ){

    return ( socket, done ) => {

        console.log('Check token validity');

        // Extract token from headers.
        let token = socket.handshake.headers.authorization;

        // Extract 'BEARER ' from token.
        let extractToken = token.substr(7);

        // Test token validity.
        jwt.verify(extractToken, config.security.jwtSecret, function (err, jwt_payload) {

            // If error, return.
            if (err) {
                return done(new Error('Authentication error'));
            }

            // Else, try to find user in database.
            User.findOne({_id: jwt_payload._id})
                .then( user => {
                    if ( !user ) {
                        return done(new Error('Not authorized'));
                    }
                    else if ( roles.length > 0 ) {
                        return authorizedRoles( user, roles, done );
                    }
                    else {
                        done();
                    }
                })
                .catch( err => {
                    return done(new Error(err))
                });
        });
    }
};
