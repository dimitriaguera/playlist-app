/**
 * Created by Dimitri Aguera on 30/09/2017.
 */

const iFolder = require('../controllers/indexableFolder.server.controllers.js');

module.exports = function(app){

    // Index files on DB.
    app.route('/api/indexFiles').get(iFolder.index);

    // Return only files, in deep.
    //app.route('/api/files').get(folder.searchSyncFiles);

};
