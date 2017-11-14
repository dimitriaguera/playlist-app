/**
 * Created by Dimitri Aguera on 30/09/2017.
 */

const iFolder = require('../controllers/indexableFolder.server.controllers.js');

module.exports = function(app){

    // Index files on DB.
    app.route('/api/indexFiles').get(iFolder.index);

    // Index files on DB.
    app.route('/api/indexFilesDelete').get(iFolder.deleteIndex);

    // Return children files/folder list.
    app.route('/api/getFiles').get(iFolder.getFiles);

    // Return deep files list.
    app.route('/api/getDeepFiles').get(iFolder.getDeepFiles);

};
