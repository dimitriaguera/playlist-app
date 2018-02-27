/**
 * Created by Dimitri Aguera on 30/09/2017.
 */

const folder = require('../controllers/folder.server.controllers');

const path = require('path');
const routeStrategy = require(path.resolve('./modules/users/server/config/route.strategy'));

module.exports = function (app) {
  // Return index file.
  app.route('/api/folder')
    .all(routeStrategy.needAuthentication)
    .get(folder.open);

  // Return only files, in deep.
  app.route('/api/files')
    .all(routeStrategy.needAuthentication)
    .get(folder.searchSyncFiles);
};
