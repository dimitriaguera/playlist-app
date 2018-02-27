/**
 * Created by Dimitri Aguera on 28/08/2017.
 */

'use strict';

const path = require('path');
const routeStrategy = require(path.resolve('./modules/users/server/config/route.strategy'));

module.exports = function (app) {
  const users = require('../controllers/users.server.controllers');

  // Login api
  app.route('/api/login')
    .all(routeStrategy.needAuthentication)
    .post(users.login);

  // Register api
  app.route('/api/register')
    .all(routeStrategy.needAuthentication)
    .post(users.register);

  // Account
  app.route('/api/account')
    .all(routeStrategy.needAuthentication)
    .get(users.account);

  // Users list
  app.route('/api/users')
    .all(routeStrategy.needAuthentication)
    .get(users.users);

  // Unique user
  app.route('/api/users/:userName')
    .all(routeStrategy.needAuthentication)
    .get(users.user)
    .put(users.update)
    .delete(users.delete);

  app.param('userName', users.userByName);
};
