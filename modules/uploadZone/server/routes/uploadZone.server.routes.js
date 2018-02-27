/**
 * Created by Marc Foletto on 23/01/2018.
 */

const upload = require('../controllers/uploadZone.server.controllers');

const path = require('path');
const routeStrategy = require(path.resolve('./modules/users/server/config/route.strategy'));

module.exports = function (app) {
  // Send File
  app.route('/api/sendFiles')
    .all(routeStrategy.needAuthentication)
    .post(upload.multerUp.array('files'), upload.afterUpload);
};
