/**
 * Created by Dimitri Aguera on 30/09/2017.
 */

const folder = require('../controllers/folder.server.controllers.js');

module.exports = function (app) {
  // Return index file.
  app.route('/api/folder').get(folder.open);

  // Return only files, in deep.
  app.route('/api/files').get(folder.searchSyncFiles);
};
