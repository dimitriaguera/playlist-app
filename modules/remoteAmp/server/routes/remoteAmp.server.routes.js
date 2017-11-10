/**
 * Created by Dimitri Aguera on 28/08/2017.
 */

'use strict';

const path = require('path');
const passport = require('passport');
const authorizeRoles = require(path.resolve('./modules/users/server/roles/route.role.authorize'));
const { REMOTEAMP_ROLE } = require(path.resolve('./modules/users/commons/roles'));

module.exports = function (app) {

    const remoteAmp = require('../controllers/remoteAmp.server.controllers');

    // Users list
    app.route('/api/remoteAmp/:toDo').all(passport.authenticate('jwt', { session: false }), authorizeRoles(REMOTEAMP_ROLE))
        .get( remoteAmp.toDo );

};
