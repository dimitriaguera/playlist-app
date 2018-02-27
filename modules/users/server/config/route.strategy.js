/**
 * Created by Marc Foletto on 23/02/2018.
 *
 * This file export route middleware to
 * check if a route need authentication
 */
'use strict';

const path = require('path');
const chalk = require('chalk');

const routeConf = require(path.resolve('./config/routes/config.routes.server'));

const passport = require('passport');

const objService = require(path.resolve('./modules/core/server/services/obj.server.services'));

const authorizeRoles = require(path.resolve('./modules/users/server/roles/route.role.authorize'));
const { ADMIN_ROLE } = require(path.resolve('./modules/users/commons/roles'));

module.exports.needAuthentication = function (req, res, next){

  let role = routeConf[req.route.path];
  if (objService.isString(role)) role = [role];

  if (role === false) {
    return next();

  } else if (objService.isArray(role)) {


    passport.authenticate('jwt', { session: false }, function(err, user, info) {

      if (err) return next(err);
      if (!user) return res.redirect('/login');

      req.user = user;

      authorizeRoles(...role)(req, res, next);

    })(req, res, next);


  } else {
    console.log(chalk.bgRed('Unknow root : ' + req.route.path));
    console.log(chalk.bgRed('Put this route in ./config/routes/config.routes.server.js to clarify sitution'));
    console.log(chalk.bgRed('By default this route gonna to be protected'));

    authorizeRoles(ADMIN_ROLE)(req, res, next);

  }




};

