/**
 * Created by Marc Foletto on 23/01/2018.
 */

const upload = require('../controllers/uploadZone.server.controllers');

module.exports = function (app) {

  // Send File
  app.route('/api/sendFiles')
    .post(upload.multerUp.array('files'), upload.afterUpload);

};
