/**
 * Created by Dimitri Aguera on 30/09/2017.
 */
const nodes = require('../controllers/nodes.server.controllers');
const files = require('../controllers/files.server.controllers');
const elastic = require('../controllers/elastic.server.controllers');

module.exports = function(app) {
  // Extract all covers from folders or meta.
  app.route('/api/files/cover/all').post(files.createAllCovers);

  // Extract and create jpg cover from meta.
  // app.route('/api/files/cover').get(files.createCoverFromTrack);

  // // Test, copy, extract all covers.
  // app.route('/api/files/covers/album').get(files.createCoversFromAlbum);
  //
  // // Test, copy, extract all covers.
  // app.route('/api/files/covers/artist').get(files.createCoversFromArtist);

  // Update Node Meta
  app.route('/api/nodes/:id/meta').put(nodes.updateMeta);

  // Update or delete a Node.
  app
    .route('/api/nodes/:id')
    .put(nodes.update)
    .delete(nodes.delete);

  // Index files in Nodes DB.
  app.route('/api/nodes/build').post(nodes.index);

  // Get Node children from query path or id.
  app.route('/api/nodes/:query/child').get(nodes.openNode);

  // Get deeply all Nodes files from querying Node.
  app.route('/api/nodes/:query/files').get(nodes.getFilesNode);

  // Index all Nodes into elastisearch folder index.
  app.route('/api/elastic/build').post(elastic.index);
  app.route('/api/elastic/test').get(elastic.test);
  // .put(elastic.update)
  // .delete(elastic.delete);

  // Get searching nodes from elastisearch query.
  app.route('/api/album/:key').get(elastic.getAlbum);
  app.route('/api/album/tracks/:key').get(elastic.getAlbumWithTracks);
  app.route('/api/search/:type').get(elastic.search);
  app.route('/api/suggest/:type').get(elastic.suggest);

  // Get a Node and attach it to req.
  app.param('id', nodes.getNodeById);
  app.param('query', nodes.getNodeFromQuery);
  app.param('key', elastic.getAlbumByKey);
};
