/**
 * Created by Dimitri Aguera on 30/09/2017.
 */

const path = require('path');
const nodes = require('../controllers/nodes.server.controllers');
const files = require('../controllers/files.server.controllers');
const elastic = require('../controllers/elastic.server.controllers');
const routeStrategy = require(path.resolve('./modules/users/server/config/route.strategy'));

module.exports = function (app) {
  // Extract all covers from folders or meta.
  app.route('/api/files/cover/all')
    .all(routeStrategy.needAuthentication)
    .post(files.createAllCovers);

  // Extract and create jpg cover from meta.
  // app.route('/api/files/cover')
  // .all(routeStrategy.needAuthentication)
  // .get(files.createCoverFromTrack);

  // // Test, copy, extract all covers.
  // app.route('/api/files/covers/album')
  // .all(routeStrategy.needAuthentication)
  // .get(files.createCoversFromAlbum);
  //
  // // Test, copy, extract all covers.
  // app.route('/api/files/covers/artist')
  // .all(routeStrategy.needAuthentication)
  // .get(files.createCoversFromArtist);


  // Update Node Meta
  app.route('/api/nodes/:id/meta')
    .all(routeStrategy.needAuthentication)
    .put(nodes.updateMeta);

  // Update or delete a Node.
  app.route('/api/nodes/:id')
    .all(routeStrategy.needAuthentication)
    .put(nodes.update)
    .delete(nodes.delete);


  // Index files in Nodes DB.
  app.route('/api/nodes/build')
    .all(routeStrategy.needAuthentication)
    .post(nodes.index);

  // Get Node children from query path or id.
  app.route('/api/nodes/:query/child')
    .all(routeStrategy.needAuthentication)
    .get(nodes.openNode);

  // Get deeply all Nodes files from querying Node.
  app.route('/api/nodes/:query/files')
    .all(routeStrategy.needAuthentication)
    .get(nodes.getFilesNode);

  // Index all Nodes into elastisearch folder index.
  app.route('/api/elastic/build')
    .all(routeStrategy.needAuthentication)
    .post(elastic.index);

  app.route('/api/elastic/test')
    .all(routeStrategy.needAuthentication)
    .get(elastic.test);
  // .put(elastic.update)
  // .delete(elastic.delete);

  // Get searching nodes from elastisearch query.
  app.route('/api/album/:key')
    .all(routeStrategy.needAuthentication)
    .get(elastic.getAlbum);
  app.route('/api/album/tracks/:key')
    .all(routeStrategy.needAuthentication)
    .get(elastic.getAlbumWithTracks);
  app.route('/api/search/:type')
    .all(routeStrategy.needAuthentication)
    .get(elastic.search);
  app.route('/api/suggest/:type')
    .all(routeStrategy.needAuthentication)
    .get(elastic.suggest);

  // Get a Node and attach it to req.
  app.param('id', nodes.getNodeById);
  app.param('query', nodes.getNodeFromQuery);
  app.param('key', elastic.getAlbumByKey);
};
