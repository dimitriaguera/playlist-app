/**
 * Created by Dimitri Aguera on 30/08/2017.
 */
const core = require('../controllers/core.server.controllers.js');

module.exports = function(app, devTools){

    // Return a 404 for all undefined api, module or lib routes
    app.route('/:url(api|modules|lib)/*').get(core.renderNotFound(devTools));

    // Return index file.
    app.route('/*').get(core.index(devTools));

};
