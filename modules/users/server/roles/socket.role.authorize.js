/**
 * Created by Dimitri Aguera on 28/08/2017.
 */
'use strict';

const _ = require('lodash');

module.exports = function ( user, authorizedRoles, next ) {

        const userRoles = user.roles;
        const ids = [];

        for ( let i = 0; i < authorizedRoles.length; i++ ) ids.push(authorizedRoles[i].id);

        if (!_.intersection(userRoles, ids).length) {
            return next( new Error('Not authorized') );
        }
        next();
};