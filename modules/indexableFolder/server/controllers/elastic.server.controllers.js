/**
 * Created by Dimitri Aguera on 30/09/2017.
 */
const co = require('co');
const path = require('path');
const _ = require('lodash');
const chalk = require('chalk');
const config = require(path.resolve('./config/env/config.server'));
const errorHandler = require(path.resolve('./modules/core/server/services/error.server.services'));
const _obj = require(path.resolve('./modules/core/server/services/obj.server.services'));
const taskRunner = require(path.resolve('./modules/task/server/services/task.server.services'));
const Node = require(path.resolve('./modules/indexableFolder/server/models/indexableFolder.server.models'));
const ps = require(path.resolve('./modules/core/client/services/core.path.services'));
const es = require(path.resolve('./modules/indexableFolder/server/elastic/elasticsearch'));
const indices_body = require(path.resolve('./modules/indexableFolder/server/elastic/mappings.server.elastic'));
const { getAlbumKeyFromTrackNodeMeta, normalizedMeta } = require(path.resolve('./modules/indexableFolder/server/services/indexableFolder.key.services'));

/**
 * Master indexation controller.
 * Delete and create all elasticsearch index.
 * Build albums, artist, genre and tracks index on elasticsearch db,
 * from all nodes tracks recorded in mongoDB.
 *
 * @param req
 * @param res
 * @param next
 */
exports.index = function (req, res, next) {
  // Get query params.
  const fullLogs = req.query.logs;

  // Create taskRunner instance.
  const runTask = taskRunner.create(req, res, next);

  // Start Task.
  runTask(
    {
      key: 'index elastic',
      unique: true
    },
    runIndexElastic(fullLogs)
  );
};


exports.runElasticUpdates = function (nodes, callback, fLogs) {
  const fullLogs = fLogs || false;

  // Start query, filter, index operations.
  co(run).then(
    // If success, call task runner with logs.
    // data => res.json(data),
    data => {
      return callback(null, data)
    },
    // If error during process, call task runner with logs + error.
    err => {
      return callback(err)
    }
  );

  function * run () {
    // Logs created here to make accessible for try and catch blocs.
    const logs = {elastic_updates: {total_count: {}, bulk_operations: []}, history: []};

    // Let's start adventure.
    try {
      const chunk = [];
      const albumsToUpdate = [];

      const storage = {
        albums: {
          old: [],
          new: []
        },
        genres: {
          testToAdd: [],
          testToDelete: []
        },
        artists: {
          testToAdd: [],
          testToDelete: []
        }
      };

      // Go go go !
      logs.history.push(`PROCESS START`);

      // Init elastic log report.
      const getIndexLog = initIndexLog(logs.elastic_updates.total_count, fullLogs);

      // Get tracks elastic documents.
      try {
        const existingTracks = extractExistingDocs(
          yield promiseMultiDocFromNodes('tracks', nodes)
        );

        // Init function that test each track,
        // and extract from metadata all albums, genre, or artists to work on in storage object.
        const runTestTrack = trackTestInit(chunk, storage);

        // Loop for each node.
        for (let i = 0, l = nodes.length; i < l; i++) {
          // Get one node.
          const node = nodes[i];
          // Normalize track meta.
          const meta = normalizedMeta(node);
          // Load corresponding elastic track document, if exist.
          const track = existingTracks[node._id];
          // Populate storage from meta track info.
          runTestTrack(node, meta, track, storage);
        }
        logs.history.push(`Step 1 - ${nodes.length} tracks node old/new metadata tested.`);
      }
      catch (err) {
        logs.history.push(`Error occurs during step 1 - extract and test meta form tracks node and tracks elastic.`);
        throw err;
      }

      // Remove double, or values both in toAdd and toDelete to avoid double bulk on same document.
      // Albums, genres and artists storage are processed.
      normalizeStorageValues(storage);

      // Switch action, if album is already indexed or not in elasticsearch.
      if (storage.albums.new.length !== 0) {
        try {
          switchActionOnDocsExist(
            // Get albums from updated keys.
            yield promiseMultiDocFromId('album', storage.albums.new.map(item => item.key)),
            // If album already indexed, push in update list.
            key => {
              albumsToUpdate.push(storage.albums.new[key].key);
              console.log(`Step 2 - Album with key ${storage.albums.new[key].key} already exists. Add it to update queue.`);
              logs.history.push(`Step 2 - Album with key ${storage.albums.new[key].key} already exists. Add it to update queue.`);
            },
            // If album no indexed, push in chunk.
            key => {
              chunk.push(buildAlbumToRecord(storage.albums.new[key].node.meta, storage.albums.new[key].key));
              console.log(`Step 2 - Album with key ${storage.albums.new[key].key} no exists. Index action push to elastic bulk.`);
              logs.history.push(`Step 2 - Album with key ${storage.albums.new[key].key} no exists. Index action push to elastic bulk.`);
            }
          );
        }
        catch (err) {
          logs.history.push(`Error occurs during step 2 - add new albums to bulk index.`);
          throw err;
        }
      }

      // Time to proceed the first bach of chunk.
      // Bulk index chunk on elastic.
      try {
        yield loopOnChunk(
          chunk,
          (count, size) => {
            // Callback before send elastic api request.
            // Increment chunk index counter.
            console.log(`Step 3 - Start bulk index ${count}. Indexing ${size} documents...`);
          },
          (data, count, size) => {
            // Callback after index done in elastic.
            // Log result.
            logs.elastic_updates.bulk_operations.push({
              bulk_operation_number: count,
              bulk_size: size,
              ...getIndexLog(data)
            });
            logs.history.push(`Step 3 - ${size} bulk actions performed in elastic tracks index.`);
          }
        );
      }
      catch (err) {
        logs.history.push(`Error occurs during step 3 - tracks bulk index.`);
        throw err;
      }

      try {
        // Now testing if old album keys still have tracks.
        // If no tracks, delete album from index.
        if (storage.albums.old.length !== 0) {
          try {
            yield switchActionIfMatchingTracks(
              // Album keys to test.
              storage.albums.old,
              // Params routing for each search.
              key => {
                return {body: {query: {term: {albumKey: key}}}}
              },
              // Callback with tracks.
              (key, data) => {
                const toUpdate = getAlbumMetaToUpdate(data);
                chunk.push(buildBulkRecord('update', 'album', 'album', {doc: toUpdate}, key));
                console.log(`Step 4 - Album with key ${key} still have tracks. Update it:`, toUpdate);
                logs.history.push(`Step 4 - Album with key ${key} still have tracks. Updates action push to elastic bulk : ${toUpdate.toString()}`);
              },
              // Callback without tracks
              key => {
                chunk.push(buildBulkRecord('delete', 'album', 'album', null, key));
                console.log(`Step 4 - Album with key ${key} no have tracks anymore. Delete push to elastic bulk.`);
                logs.history.push(`Step 4 - Album with key ${key} no have tracks anymore. Delete push to elastic bulk.`);
              }
            );
          }
          catch (err) {
            logs.history.push(`Error occurs during step 4 - test modified albums, and add to bulk for delete or update.`);
            throw err;
          }
        }

        // Testing and update albums registered has new, but already indexed.
        // Now testing if old album keys still have tracks.
        // If no tracks, delete album from index.
        if (albumsToUpdate.length !== 0) {
          try {
            yield switchActionIfMatchingTracks(
              // Album keys to test.
              albumsToUpdate,
              // Params routing for each search.
              key => {
                return {body: {query: {term: {albumKey: key}}}}
              },
              // Callback with tracks.
              (key, data) => {
                const toUpdate = getAlbumMetaToUpdate(data);
                chunk.push(buildBulkRecord('update', 'album', 'album', {doc: toUpdate}, key));
                console.log(`Step 5 - Album with key ${key} still have tracks. Update it:`, toUpdate);
                logs.history.push(`Step 5 - Album with key ${key} still have tracks. Updates action push to elastic bulk : ${toUpdate.toString()}`);
              },
              // Callback without tracks
              key => {
                console.log(`Step 5 - Elasticsearch cache problem, this album with key ${key} must have tracks...`);
                logs.history.push(`Step 5 - Elasticsearch cache problem, this album with key ${key} must have tracks...`);
              }
            );
          }
          catch (err) {
            logs.history.push(`Error occurs during step 5 - second update test for albums.`);
            throw err;
          }
        }

        // Switch action, if genre is already indexed or not in elasticsearch.
        // If no indexed, add it.
        if (storage.genres.testToAdd.length !== 0) {
          try {
            switchActionOnDocsExist(
              // Get genres docs.
              yield promiseMultiDocFromId('genre', storage.genres.testToAdd),
              // If genre already indexed, do nothing.
              key => {
                console.log(`Step 6 - Genre ${storage.genres.testToAdd[key]} already exist.`);
                logs.history.push(`Step 6 - Genre ${storage.genres.testToAdd[key]} already exist. Nothing to push in elastic bulk.`);
              },
              // Else if genre no indexed, add it.
              key => {
                chunk.push(buildGenreToRecord(storage.genres.testToAdd[key]));
                console.log(`Step 6 - Genre ${storage.genres.testToAdd[key]} no exist. Index action push to elastic bulk.`);
                logs.history.push(`Step 6 - Genre ${storage.genres.testToAdd[key]} no exist. Index action push to elastic bulk.`);
              }
            );
          }
          catch (err) {
            logs.history.push(`Error occurs during step 6 - test genres to add.`);
            throw err;
          }
        }

        // Switch action test :
        // If genre removed from updating tracks,
        // Don't have others tracks indexed with,
        // Remove them from index genre.
        if (storage.genres.testToDelete.length !== 0) {
          try {
            yield switchActionIfMatchingTracks(
              // Album keys to test.
              storage.genres.testToDelete,
              // Params routing for each search.
              key => {
                return {body: {query: {match: {'meta.genre': key}}}}
              },
              // Callback with tracks.
              key => {
                console.log(`Step 7 - Genre ${key} still have tracks.`);
                logs.history.push(`Step 7 - Genre ${key} still have tracks. Nothing to push in elastic bulk.`);
              },
              // Callback without tracks
              key => {
                chunk.push(buildBulkRecord('delete', 'genre', 'genre', null, key));
                console.log(`Step 7 - No tracks for genre ${key}. Delete action push to elastic bulk.`);
                logs.history.push(`Step 7 - No tracks for genre ${key}. Delete action push to elastic bulk.`);
              }
            );
          }
          catch (err) {
            logs.history.push(`Error occurs during step 7 - test genres to delete.`);
            throw err;
          }
        }

        // Switch action, if artist is already indexed or not in elasticsearch.
        // If no indexed, add it.
        if (storage.artists.testToAdd.length !== 0) {
          try {
            switchActionOnDocsExist(
              // Get genres docs.
              yield promiseMultiDocFromId('artist', storage.artists.testToAdd),
              // If genre already indexed, do nothing.
              key => {
                console.log(`Step 8 - Artist ${storage.artists.testToAdd[key]} already exist.`);
                logs.history.push(`Step 8 - Artist ${storage.artists.testToAdd[key]} already exist. Nothing to push in elastic bulk.`);
              },
              // Else if genre no indexed, add it.
              key => {
                chunk.push(buildArtistToRecord(storage.artists.testToAdd[key]));
                console.log(`Step 8 - Artist ${storage.artists.testToAdd[key]} no exist. Index action push to elastic bulk.`);
                logs.history.push(`Step 8 - Artist ${storage.artists.testToAdd[key]} no exist. Index action push to elastic bulk.`);
              }
            );
          }
          catch (err) {
            logs.history.push(`Error occurs during step 8 - test artists to add.`);
            throw err;
          }
        }

        // Switch action test :
        // If artist removed from updating tracks,
        // Don't have others tracks indexed with,
        // Remove them from index artist.
        if (storage.artists.testToDelete.length !== 0) {
          try {
            yield switchActionIfMatchingTracks(
              // Album keys to test.
              storage.artists.testToDelete,
              // Params routing for each search.
              key => {
                return {body: {query: {term: {'meta.artist': key}}}}
              },
              // Callback with tracks.
              key => {
                console.log(`Step 9 - Artist ${key} still have tracks.`);
                logs.history.push(`Step 9 - Artist ${key} still have tracks. Nothing to push in elastic bulk.`);
              },
              // Callback without tracks
              key => {
                chunk.push(buildBulkRecord('delete', 'artist', 'artist', null, key));
                console.log(`Step 9 - No tracks for artist ${key}. Delete action push to elastic bulk.`);
                logs.history.push(`Step 9 - No tracks for artist ${key}. Delete action push to elastic bulk.`);
              }
            );
          }
          catch (err) {
            logs.history.push(`Error occurs during step 9 - test artists to delete.`);
            throw err;
          }
        }

        // Finally bulk for the second and last time actions pushed in chunk.
        // Bulk index chunk on elastic.
        try {
          yield loopOnChunk(
            chunk,
            (count, size) => {
              // Callback before send elastic api request.
              // Increment chunk index counter.
              console.log(`Step 10 - Start bulk index ${count}. Indexing ${size} documents...`);
            },
            (data, count, size) => {
              // Callback after index done in elastic.
              // Log result.
              logs.elastic_updates.bulk_operations.push({
                bulk_operation_number: count,
                bulk_size: size,
                ...getIndexLog(data)
              });
              logs.history.push(`Step 10 - ${size} bulk actions performed in elastic.`);
            }
          );
        }
        catch (err) {
          logs.history.push(`Error occurs during step 10 - proceed genre, artist, album bulk actions in elastic.`);
          throw err;
        }

        // This is the end.
        logs.history.push(`PROCESS END - SUCCESS`);

        // Return logs to report.
        return {...logs};
      }

      // After first bulk error catched to add a warning
      // about half-made elastic index update :
      // tracks are updated, but albums, genre and artists are not...
      catch (err) {
        // Add warning message.
        logs.warning = 'Error occurs between two bulk index sessions. At that point, tracks index is updated, but artist, genre and album index are not. You must rebuild all index.';
        // Delegate error management.
        throw err;
      }
    }
    // Global Error catched to add logs.
    catch (err) {
      // Bad news....
      logs.history.push(`PROCESS END - ERROR`);
      // Delegate errors to co.then
      throw {
        error: err,
        ...logs
      };
    }
  }
};

function normalizeStorageValues (storage) {
  // Need to test if album key is both in new and old storage.
  // If both, delete old.
  storage.albums.old = storage.albums.old.filter(item => {
    for (let i = 0, l = storage.albums.new.length; i < l; i++) {
      if (storage.albums.new[i].key === item) return false;
    }
    return true;
  });

  // Need to make uniq the multiple keys of genre and artist to test.
  storage.genres.testToAdd = _.uniq(storage.genres.testToAdd);
  storage.genres.testToDelete = _.uniq(storage.genres.testToDelete);

  // Prevent toAdd item being deleted, or existing item to be addTested.
  // Get commons values.
  const commonGenre = _.intersection(storage.genres.testToDelete, storage.genres.testToAdd);
  const commonArtist = _.intersection(storage.artists.testToDelete, storage.artists.testToAdd);

  // Remove commons values.
  storage.genres.testToDelete = _.difference(storage.genres.testToDelete, commonGenre);
  storage.genres.testToAdd = _.difference(storage.genres.testToAdd, commonGenre);
  storage.artists.testToDelete = _.difference(storage.artists.testToDelete, commonArtist);
  storage.artists.testToAdd = _.difference(storage.artists.testToAdd, commonArtist);
}

function getAlbumMetaToUpdate (data) {
  const album = {genre: [], artist: []};
  let toUpdate = {};
  for (let j = 0, m = data.length; j < m; j++) {
    testAlbumNeedUpdate(album, data[j]._source.meta, toUpdate);
    // console.log('OLD ALBUMS loop update test: ', toUpdate);
  }
  return toUpdate;
}

function trackTestInit (chunk, storage) {
  return (node, meta, track) => {
    // Apply normalized meta.
    node.meta = meta;

    // Get albumKey from node.
    const nKey = getAlbumKeyFromTrackNodeMeta(ps, meta);

    // If track exist in elasticsearch.
    if (track) {
      // Store old/new genre and artist meta values.
      hasModifiedGenre(storage.genres, track.meta.genre, meta.genre);

      // Test if artist change. If yes, store it.
      if (track.meta.artist !== meta.artist) {
        _obj.pushUniq(track.meta.artist, storage.artists.testToDelete);
        _obj.pushUniq(meta.artist, storage.artists.testToAdd);
      }

      // Test if albumartist change. If yes, store it.
      if (track.meta.albumartist !== meta.albumartist) {
        _obj.pushUniq(track.meta.albumartist, storage.artists.testToDelete);
        _obj.pushUniq(meta.albumartist, storage.artists.testToAdd);
      }

      // If albumKey moved, store value and node, to test album.
      if (nKey !== track.albumKey) {
        pushUniqAlbum({key: nKey, node: node}, storage.albums.new);
      }
      // Update tracks document in elasticsearch.
      chunk.push(buildTracksToRecord(node, meta, nKey, 'update'));
      // Store track album key to run update later.
      if (track.albumKey !== '') _obj.pushUniq(track.albumKey, storage.albums.old);
    }
    // If track no exist, index it.
    else {
      storage.genres.testToAdd = storage.genres.testToAdd.concat(meta.genre);
      if (meta.artist) _obj.pushUniq(meta.artist, storage.artists.testToAdd);
      if (meta.albumartist) _obj.pushUniq(meta.albumartist, storage.artists.testToAdd);
      pushUniqAlbum({key: nKey, node: node}, storage.albums.new);
      chunk.push(buildTracksToRecord(node, meta, nKey));
    }
  }
}

function hasModifiedGenre (store, theOlds, theNews) {
  const toDelete = _.difference(theOlds, theNews);
  const toAdd = _.difference(theNews, theOlds);

  store.testToDelete = store.testToDelete.concat(toDelete);
  store.testToAdd = store.testToAdd.concat(toAdd);
}

function pushUniqAlbum (album, array) {
  if (array.findIndex(elmt => elmt.key === album.key) === -1) {
    array.push(album);
  }
}

function * switchActionIfMatchingTracks (keys, paramFactory, withTracks, withoutTracks) {
  const defaultParams = {
    body: {query: {term: {}}},
    requestCache: false
  };

  for (let i = 0, l = keys.length; i < l; i++) {
    const params = Object.assign({}, defaultParams, paramFactory(keys[i]));
    const data = yield promiseSimpleSearch('tracks', params);

    if (data.hits.total === 0) {
      withoutTracks(keys[i]);
      continue;
    }
    withTracks(keys[i], data.hits.hits);
  }
}

function switchActionOnDocsExist (docs, callExist, callNoExist) {
  for (let i = 0, l = docs.length; i < l; i++) {
    if (docs[i].found) {
      callExist(i, docs[i]._id);
    }
    else {
      callNoExist(i, docs[i]._id);
    }
  }
}

function extractExistingDocs (docs) {
  const exists = {};
  for (let i = 0, l = docs.length; i < l; i++) {
    if (docs[i].found) {
      exists[docs[i]._id] = docs[i]._source;
    }
  }
  return exists;
}


/**
 * Start general indexation in elasticsearch from all tracks in nodes collection.
 * Album, artists and genre are extracted from all tracks metadata...
 * Create 4 index :
 * - album
 * - artist
 * - tracks
 * - genre
 *
 * @param fullLogs Bool - extended index logs, or small index logs.
 *
 */
function runIndexElastic (fullLogs) {
  return function (onError, onStep, onDone) {
    const logs = [];

    // Node query to get all tracks.
    const query = Node.find({isFile: true}).select('path meta name publicName _id');

    // Start query, filter, index operations.
    co(run).then(
      // If success, call task runner with logs.
      onDone,
      // If error during process, call task runner with logs + error.
      e => {
        logs.push(e);
        onError({logs: logs});
      }
    );

    // Master generator function.
    function * run () {
      // Chunk array contain actions to pass to elastic bulk index/update method.
      const chunk = [];
      // Max number operations to bulk at same time.
      const chunkMaxSize = config.index.sizeChunkElastic;
      // Declare counter object returned at end of bulk index operations.
      const counter = {};
      // Declare keys vars that register all entities already filtered from tracks.
      const keys = {alKeys: {}, arKeys: {}, geKeys: {}};
      // Set mongoDB cursor.
      const cursor = query.cursor();
      // Init elastic log report.
      const getIndexLog = initIndexLog(counter, fullLogs);
      // Init bulk index operation number.
      let chunkCount = 0;

      // Start reset all index.
      yield clearIndices(['album', 'artist', 'tracks', 'genre'], logs);

      // Start loop on mondoDB documents.
      for (let node = yield cursor.next(); node != null; node = yield cursor.next()) {
        // Create entities to index from each track node.
        extractDataFromMeta(node, keys, chunk);
        // Bulk index entities.
        yield proceedOneByOneChunks();
      }

      // Proceed the last part of the chunk.
      yield promiseProceedChunk(
        chunk,
        () => {
          // Before send elastic api request.
          // Increment chunk index counter.
          chunkCount++;
          // Set task runner step.
          onStep(`Start bulk index ${chunkCount}. Indexing ${chunk.length} documents...`)
        },
        data => {
          // Log result.
          logs.push({bulk_operation_number: chunkCount, bulk_size: chunk.length, ...getIndexLog(data)});
          // Clear chunk.
          chunk.length = 0;
        }
      );

      // Function that test if chunk is big enought.
      // And start elastic bulk index process.
      function * proceedOneByOneChunks () {
        // Get number of operations in current chunk.
        const chunkSize = chunk.length;

        // If chunk is bigger enought, start indexation process.
        if (chunkSize >= chunkMaxSize) {
          yield promiseProceedChunk(
            chunk,
            () => {
              // Before send elastic api request.
              // Increment chunk index counter.
              chunkCount++;
              // Set task runner step.
              onStep(`Start bulk index ${chunkCount}. Indexing ${chunkSize} documents...`)
            },
            data => {
              // After index done in elastic.
              // Clear chunk array.
              chunk.splice(0, chunkSize);
              // Log result.
              logs.push({bulk_operation_number: chunkCount, bulk_size: chunkSize, ...getIndexLog(data)});
            }
          );
        }
      }

      // Return logs to report.
      return {total_count: counter, logs: logs};
    }
  }
}

function promiseProceedChunk (chunk, onStep, onDone) {
  return new Promise((resolve, reject) => {
    // Callback.
    onStep();
    // Start async bulk index process.
    es.indexBulk(chunk, (err, data) => {
      if (err) {
        return reject(err);
      }
      // Callback.
      onDone(data);
      // Exit.
      resolve();
    });
  });
}

function * loopOnChunk (chunk, onStep, onDone) {
  // Max number operations to bulk at same time.
  const chunkMaxSize = config.index.sizeChunkElastic;
  // Init bulk index operation number.
  let chunkCount = 0;
  // Start loop.
  while (chunk.length > 0) {
    const part = _obj.splitTab(chunk, chunkMaxSize);

    yield promiseProceedChunk(
      part,
      () => {
        // Before send elastic api request.
        // Increment chunk index counter.
        chunkCount++;
        // Set task runner step.
        return onStep(chunkCount, part.length);
      },
      data => {
        // After index done in elastic.
        return onDone(data, chunkCount, part.length);
      }
    );
  }
}


/**
 * Function that clear and create index.
 *
 * @param logs
 * @param indices
 */
function * clearIndices (indices, logs = []) {
  // Delete and re-build indexes.
  for (let i = 0, l = indices.length; i < l; i++) {
    const index = indices[i];
    const body = indices_body[index + '_body'];

    // Delete index.
    yield new Promise((resolve, reject) => {
      // Start async process.
      es.indexDelete([index], err => {
        if (err) {
          return reject(err);
        }
        const message = `index ${index} deleted`;
        console.log(chalk.cyan(message));
        logs.push(message);
        resolve();
      });
    });

    // Create index.
    yield new Promise((resolve, reject) => {
      // Start async process.
      es.indexCreate({index: index, body: body}, err => {
        if (err) {
          return reject(err);
        }
        const message = `index ${index} created`;
        console.log(chalk.cyan(message));
        logs.push(message);
        resolve();
      });
    });
  }
  return logs;
}


// function getAlbumKeyFromTrackNodeMeta (meta) {
//   let artistKEY = meta.albumartist || meta.artist;
//   return ps.buildSeparator([artistKEY, meta.album, meta.diskno], '___');
// }

// function normalizedMeta (node) {
//   const nMeta = Object.assign({}, node.meta);
//   nMeta.artist = nMeta.artist ? nMeta.artist.toLowerCase() : '';
//   nMeta.albumartist = nMeta.albumartist ? nMeta.albumartist.toLowerCase() : '';
//   nMeta.album = nMeta.album ? nMeta.album.toLowerCase() : '';
//   nMeta.title = nMeta.title ? nMeta.title : node.publicName;
//   return nMeta;
// }


function extractDataFromMeta (node, keys, chunk) {
  const { alKeys, arKeys, geKeys } = keys;

  /** *********** Core ***************/
  const meta = normalizedMeta(node);

  // Create unique key for album.
  let albumKEY = getAlbumKeyFromTrackNodeMeta(ps, meta);

  // Add track record.
  chunk.push(buildTracksToRecord(node, meta, albumKEY));

  // If no meta artist, album artist, album title, or disc, no create album.
  if (albumKEY === '') return;

  // If album tracks not yet created,
  // Create and push it in albums array.
  if (!alKeys[albumKEY]) {
    chunk.push(buildAlbumToRecord(meta, albumKEY));
    alKeys[albumKEY] = {
      artist: [meta.artist],
      genre: meta.genre
    };
  }

  // If album tracks already in album array.
  else {
    // Get already registred album.
    const currentAlbum = alKeys[albumKEY];
    const toUpdate = {};
    testAlbumNeedUpdate(currentAlbum, meta, toUpdate);

    // If need to update, push it in chunk array.
    if (toUpdate.artist || toUpdate.genre) {
      chunk.push(buildBulkRecord('update', 'album', 'album', {doc: toUpdate}, albumKEY));
    }
  }

  // let artistTest = artist ? artist.toLowerCase() : null;
  let artistTest = meta.artist;

  // Proceed artists list.
  if (!arKeys[artistTest]) {
    arKeys[artistTest] = true;
    chunk.push(buildArtistToRecord(meta.artist));
  }

  // Proceed artists list with albumartist.
  if (meta.albumartist && !arKeys[meta.albumartist]) {
    arKeys[meta.albumartist] = true;
    chunk.push(buildArtistToRecord(meta.albumartist));
  }

  // Proceed genre list.
  for (let i = 0; i < meta.genre.length; i++) {
    const gen = meta.genre[i];
    if (!geKeys[gen]) {
      geKeys[gen] = true;
      chunk.push(buildGenreToRecord(gen));
    }
  }
}

function testAlbumNeedUpdate (album, newProps, toUpdate) {
  // Get already registred album.
  const addGenre = testMergeArray(album.genre, newProps.genre);

  // Test if have to add tracks artist to album artist pool.
  if (album.artist.indexOf(newProps.artist) === -1) {
    album.artist.push(newProps.artist);
    toUpdate.artist = album.artist;
  }

  // Test if have to add tracks genre to album genre.
  if (addGenre) {
    album.genre = addGenre;
    toUpdate.genre = addGenre;
  }
  return toUpdate;
}


function buildAlbumToRecord (meta, albumKEY) {
  const _doc = {
    suggest: {
      input: meta.album
    },
    name: meta.album,
    keyName: meta.album,
    artist: [meta.artist],
    albumartist: meta.albumartist,
    year: meta.year,
    diskno: meta.diskno,
    diskof: meta.diskof,
    label: meta.label,
    genre: meta.genre,
    key: albumKEY
  };
  return buildBulkRecord('index', 'album', 'album', _doc, albumKEY);
}


function buildTracksToRecord (track, meta, albumKEY, action = 'index') {
  const entity = {
    suggest: {
      input: meta.title
    },
    tracksId: track._id,
    path: track.path,
    name: track.name,
    publicName: track.publicName,
    meta: meta,
    albumKey: albumKEY
  };
  const _doc = (action === 'update') ? {doc: entity} : entity;
  return buildBulkRecord(action, 'tracks', 'tracks', _doc, track._id);
}

function buildArtistToRecord (artist) {
  const _doc = {
    suggest: {
      input: artist
    },
    name: artist,
    keyName: artist
  };
  return buildBulkRecord('index', 'artist', 'artist', _doc, artist);
}

function buildGenreToRecord (genre) {
  const _doc = {
    suggest: {
      input: genre
    },
    name: genre,
    keyName: genre
  };
  return buildBulkRecord('index', 'genre', 'genre', _doc, genre);
}

function buildBulkRecord (action, _index, _type, _doc, _id) {
  const record = {
    action_type: action,
    _index: _index,
    _type: _type,
    _id: _id
  };
  if (_doc) record._doc = _doc;
  return record;
}

function testMergeArray (arr1, arr2) {
  // Concat arr1 and 2, remove clones
  const newArray = _.uniq(arr1.concat(arr2));
  // If more entry, return concat array.
  if (newArray.length !== arr1.length) {
    return newArray;
  }
  return false;
}

function promiseSimpleSearch (index, body) {
  return new Promise((resolve, reject) => {
    simpleSearch(index, body, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

function promiseMultiDocFromId (index, ids) {
  return new Promise((resolve, reject) => {
    getMultiDocFromId(index, ids, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

function promiseMultiDocFromNodes (index, nodes) {
  const ids = nodes.map(node => node._id);
  return promiseMultiDocFromId(index, ids);
}

function simpleSearch (index, params, callback) {
  const pars = Object.assign({index: index, type: index}, params);

  es.search(pars, (err, data) => {
    if (err) return callback(err);
    callback(null, data);
  });
}

function getMultiDocFromId (index, ids, callback) {
  const params = {
    _sourceExclude: 'suggest',
    index: index,
    type: index,
    body: {
      ids: ids
    }
  };

  es.mget(params, (err, data) => {
    if (err) return callback(err);
    callback(null, data.docs);
  });
}

function getSortValues (query) {
  if (!query) return [];
  return query.split('+');
}

function getFilterValues (key, query) {
  const r = [];
  if (query) {
    const f = query.split('+');
    for (let i = 0, l = f.length; i < l; i++) {
      r.push({term: {[key]: f[i]}});
    }
  }
  return r;
}

function getFilterRangeValues (key, query) {
  const r = [];
  if (query) {
    const ranges = query.split('+');
    for (let i = 0, l = ranges.length; i < l; i++) {
      const range = ranges[i].split('to');

      // If range[0] > range[1] inverse then
      if (range[0] > range[1]) {
        let tmp = range[0];
        range[0] = range[1];
        range[1] = tmp;
      }

      r.push({
        range: {
          [key]: {
            gte: range[0],
            lte: range[1] || range[0],
            format: 'yyyy'
          }
        }
      });
    }
  }
  return r;
}

function getFiltersFromQuery (query) {
  let filters = [];

  // Start loop query object checking.
  for (let key in query) {
    if (query.hasOwnProperty(key)) {
      const f = key.replace(/^(filter.)/g, '');

      // Go in if the key contains 'filter.'
      if (f !== key) {

        const rf = f.replace(/^(range.)/g, '');

        // Go in if the key contains 'filter.range.'
        if (rf !== f) {
          // Build filter range type array.
          filters.push(getFilterRangeValues(rf, query[key]));
        } else {
          // Build filter text type array.
          filters.push(getFilterValues(f, query[key]));
        }
      }
    }
  }

  // This function create filter query
  // Example : we want something like
  //  artist : me ; albumartist: otherme ; genre: jazz, hip-hop ; date: 1998
  //  Query would be (me OR otherme) AND (jazz OR hip-hop) AND (1998)
  // NB : It's group artist and albumArtist in should query (OR)
  function splitFilters(filters) {
    let i = 0;
    const l = filters.length;

    let filterQuery = [];

    let artistAndAlbumArtistIndex = null;

    for (; i < l ; i++) {

      if (filters[i][0].term && (Object.keys(filters[i][0].term)[0] === 'artist' || Object.keys(filters[i][0].term)[0] === 'albumartist')) {

        if (artistAndAlbumArtistIndex !== null)  {
          filterQuery[artistAndAlbumArtistIndex].bool.should = filterQuery[artistAndAlbumArtistIndex].bool.should.concat(filters[i])
        } else {
          artistAndAlbumArtistIndex = i;
          filterQuery.push(
            {
              bool: {
                should: filters[i]
              }
            }
          )
        }
      } else {
        filterQuery.push(
          {
            bool: {
              should: filters[i]
            }
          }
        )
      }
    }
    return filterQuery;
  }

  return splitFilters(filters);
}

const getAlbumByKeyFn = function(key, callback) {
  const params = {
    index: 'album',
    body: {
      query: {
        match: {
          key: key
        }
      }
    }
  };
  // Send search to elastic server.
  es.search(params, (err, data) => {
    if (err) return callback(err);
    const album = data.hits.hits[0] ? data.hits.hits[0]._source : null;
    callback(null, album);
  });
};
exports.getAlbumByKeyFn = getAlbumByKeyFn;

exports.getAlbumByKey = function(req, res, next, key) {
  getAlbumByKeyFn( ps.clean(key), (err, data) => {
    if (err) return errorHandler.errorMessageHandler(err, req, res, next);
    req.album = data;
    next();
  });
};

exports.getAlbum = function (req, res) {
  res.json({
    success: true,
    msg: req.album
  });
};

exports.getAlbumWithTracks = function (req, res){

  const term = req.album.key;
  const params = {
    index: 'tracks',
    body: {
      query: {
        match: {
          albumKey: term
        }
      }
    }
  };

  // Send search to elastic server.
  es.search(params, (err, data) => {
    if (err) return errorHandler.errorMessageHandler(err, req, res, next);

    const tracks = data.hits.hits.map( item => item._source );
    const result = Object.assign(req.album, {tracks: tracks});

    res.json({
      success: true,
      msg: result
    });
  });
};

exports.search = function (req, res, next) {
  const index = ps.clean(req.params.type);
  const exact = req.query.exact;
  const from = req.query.from ? ps.clean(req.query.from) : 0;
  const size = req.query.size ? ps.clean(req.query.size) : 1000;
  const field = req.query.fi ? ps.clean(req.query.fi) : 'name';

  const sort = getSortValues(req.query.sort);
  const filters = getFiltersFromQuery(req.query);

  let terms = ps.clean(req.query.q);

  terms = exact ? `"${terms}"` : terms + '*';
  // terms = exact ? terms : terms + '*';

  let base_query;
  let query_query;

  // Build query part.
  if (terms !== '') {
    query_query = {
      query_string: {
        query: `${terms}`,
        fields: [field],
        default_operator: 'AND'
      }
    };
  }
  else {
    query_query = {
      'match_all': {}
    };
  }

  // Build context query part.
  if (filters.length) {
    base_query = {
      bool: {
        must: query_query,
        filter: {
          bool: {
            must: filters
          }
        }
      }
    }
  } else {
    base_query = query_query;
  }

  // Build params part.
  const params = {
    index: index,
    type: index,
    sort: sort,
    body: {
      from: from,
      size: size,
      query: base_query,
      _source: {
        excludes: ['suggest']
      }
    }
  };

    // Send search to elastic server.
  es.search(params, (err, data) => {
    if (err) return errorHandler.errorMessageHandler(err, req, res, next);

    res.json({
      success: true,
      msg: data
    });
  });
};

exports.suggest = function (req, res, next) {
  const index = ps.clean(req.params.type);
  let terms = ps.clean(req.query.q);

  const base_query = {
    _source: 'suggest',
    suggest: {
      testSuggest: {
        prefix: terms,
        completion: {
          field: 'suggest',
          size: 10
        }
      }
    }
  };

  const params = {
    index: index,
    body: base_query
  };


  es.search(params, (err, data) => {
    if (err) return errorHandler.errorMessageHandler(err, req, res, next);

    res.json({
      success: true,
      msg: data
    });
  });
};


function initIndexLog (counter, fullLog) {
  return function (data) {
    const index_error_array = [];
    const update_error_array = [];
    const delete_error_array = [];

    let index_error_count = 0;
    let update_error_count = 0;
    let delete_error_count = 0;
    let index_success_count = 0;
    let update_success_count = 0;
    let delete_success_count = 0;

    try {
      for (let i = 0, l = data.items.length; i < l; i++) {
        const item = data.items[i];
        if (item.index) {
          if (!counter[item.index._index + '_index_success']) {
            counter[item.index._index + '_index_success'] = 0;
            counter[item.index._index + '_index_errors'] = 0;
          }

          if (item.index.error) {
            index_error_count++;
            counter[item.index._index + '_index_errors']++;
            if (fullLog) index_error_array.push(item.index);
            continue;
          }
          index_success_count++;
          counter[item.index._index + '_index_success']++;
        }

        else if (item.update) {
          if (!counter[item.update._index + '_update_success']) {
            counter[item.update._index + '_update_success'] = 0;
            counter[item.update._index + '_update_errors'] = 0;
          }

          if (item.update.error) {
            update_error_count++;
            counter[item.update._index + '_update_errors']++;
            if (fullLog) update_error_array.push(item.update);
            continue;
          }
          update_success_count++;
          counter[item.update._index + '_update_success']++;
        }

        else if (item.delete) {
          if (!counter[item.delete._index + '_delete_success']) {
            counter[item.delete._index + '_delete_success'] = 0;
            counter[item.delete._index + '_delete_errors'] = 0;
          }

          if (item.delete.error) {
            delete_error_count++;
            counter[item.delete._index + '_delete_errors']++;
            if (fullLog) delete_error_array.push(item.delete);
            continue;
          }
          delete_success_count++;
          counter[item.delete._index + '_delete_success']++;
        }
      }

      const logs = {
        index: {
          success_count: index_success_count,
          errors_count: index_error_count,
          errors: index_error_array
        },
        update: {
          success_count: update_success_count,
          errors_count: update_error_count,
          errors: update_error_array
        },
        delete: {
          success_count: delete_success_count,
          errors_count: delete_error_count,
          errors: delete_error_array
        }
      };

      if (fullLog) {
        logs.index.errors = index_error_array;
        logs.update.errors = update_error_array;
        logs.delete.errors = delete_error_array;
      }

      return logs;
    }
    catch (e) {
      console.error(`Bulk index OK. Building logs error : ${e.message}`);
    }
  }
}














exports.test = function (req, res, next) {

};
