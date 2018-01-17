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
exports.index = function(req, res, next){

    // Get query params.
    const fullLogs = req.query.logs;

    // Create taskRunner instance.
    const runTask = taskRunner.create(req, res, next);

    // Start Task.
    runTask(
        {
            name:'index elastic',
            unique: true
        },
        runIndexElastic(fullLogs)
    );
};





exports.test = function(req, res, next){

    const nodes = [
        {_id: '1000415'},
        {_id: '5a47790c59921b15c4b944db'},
        {_id: '1000415'},
        {_id: '5a47790c59921b15c4b944da'},
        {_id: '1000415'},
    ];

    const params =
        //{query: {match : {albumKey : `"${"sizzla___2004-speak of jah-retail cd___0"}"`}}};
        //{query: {match : {albumKey : "prout____de__la__vie"}}};
        {
            _sourceInclude: ['meta.artist', 'meta.genre'],
            //body: {query: {match : {albumKey : "sizzla___2004-speak of jah-retail cd___0"}}},
            body: {query: {match : {albumKey : "kavinsky___1986___0"}}}
            //body: {query: {match : {albumKey : "PROUTnsky___1986___0"}}}
        };

    const keys = [
        "kavinsky___1986___0",
        "kavinzefzaefrzefsky___1986___0",
        "sizzla___2004-speak of jah-retail cd___0",
        "kaviefzeffzefezfzefnsky___1986___0",
        "kaviefzeffzefezfzefnsky___1986___0",
    ];

    const chunk = [];

    function* run(){
        // Get tracks elastic documents.
        //return extractExistingDocs(
            //return yield promiseSimpleSearch('tracks', params);
            //return yield switchActionOnAlbumsWithTracks(keys);
        //);

        return yield switchActionOnAlbumsWithTracks(
            keys,
            // Callback with tracks.
            (key, data) => {
                const album = {genre: [], artist: []};
                let toUpdate = {};
                for(let j = 0, m = data.length; j < m; j++){
                    testAlbumNeedUpdate(album, data[j]._source.meta, toUpdate);
                }
                chunk.push(buildBulkRecord( 'update', 'album', 'album', {doc: toUpdate}, key ));
            },
            // Callback without tracks
            key => {
                chunk.push(buildBulkRecord( 'delete', 'album', 'album', null, key ) );
            }
        );
    }

    // Start query, filter, index operations.
    co(run).then(
        // If success, call task runner with logs.
        //data => res.json(data),
        data => res.json(chunk),
        // If error during process, call task runner with logs + error.
        e => console.log(e),
    );
};








exports.runElasticUpdates = function( nodes, fullLogs ) {

    function* run(){

        const chunk = [];
        const albumsToUpdate = [];
        const storage = {
            albums: {
                old: [],
                new: [],
            },
            genres: {
                old: [],
                new: [],
            },
            artists: {
                old: [],
                new: [],
            },
        };

        // Counter object.
        const counter = {};

        // Init elastic log report.
        const getIndexLog = initIndexLog(counter, fullLogs);

        // Get tracks elastic documents.
        const existingTracks = extractExistingDocs(
            yield promiseMultiDocFromNodes('tracks', nodes)
        );

        // Init test functions.
        const runTestTrack = trackTestInit(chunk, );

        // Loop for each node.
        for(let i = 0, l = nodes.length; i < l; i++) {

            const node = nodes[i];
            const meta = normalizedMeta(node);
            const track = existingTracks[node._id];

            runTestTrack.test(node, meta, track, storage);
        }

        // Switch action, if album is already indexed or not in elasticsearch.
        switchActionOnDocsExist(
            // Get albums from updated keys.
            yield promiseMultiDocFromNodes('album', storage.album.new),
            // If album already indexed, push in update list.
            albumKey => albumsToUpdate.push(albumKey),
            // If album no indexed, push in chunk.
            albumKey => chunk.push(buildAlbumToRecord(storage.album.new[i].node.meta, albumKey))
        );

        // Time to proceed the first bach of chunk.
        // Bulk index chunk on elastic.
        yield loopOnChunk(
            chunk,
            (count, size) => {
                // Callback before send elastic api request.
                // Increment chunk index counter.
                console.log(`Start bulk index ${count}. Indexing ${size} documents...`)
            },
            (data, count, size) => {
                // Callback after index done in elastic.
                // Log result.
                console.log({bulk_operation_number: count, bulk_size: size, ...getIndexLog(data)});
            }
        );

        // Now testing if old album keys still have tracks.
        // If no tracks, delete album from index.
        yield switchActionOnAlbumsWithTracks(
            storage.album.old,
            // Callback with tracks.
            (key, data) => {
                const album = {genre: [], artist: []};
                let toUpdate = {};
                for(let j = 0, m = data.length; j < m; j++){
                    testAlbumNeedUpdate(album, data[j]._source.meta, toUpdate);
                    //const test = data[j]._source.meta;
                }
                chunk.push(buildBulkRecord( 'update', 'album', 'album', {doc: toUpdate}, key ));
            },
            // Callback without tracks
            key => {
                chunk.push(buildBulkRecord( 'delete', 'album', 'album', null, key ) );
            }
        );
    }
};



function trackTestInit( chunk, exist, storage ) {

    return {
        test: (node, meta, track) => {

            // Apply normalized meta.
            node.meta = meta;

            // Get albumKey from node.
            const nKey = getAlbumKeyFromTrackNodeMeta(meta);

            // If track exist in elasticsearch.
            if( track ) {

                // Store old/new genre and artist meta values.
                storage.genres.old = storage.genres.old.concat(track.meta.genre);
                storage.genres.new = storage.genres.new.concat(meta.genre);

                // Test if artist change. If yes, store it.
                if( track.meta.artist !== meta.artist) {
                    storage.artist.old.push(track.meta.artist);
                    storage.artist.new.push(meta.artist);
                }

                // If albumKey moved, store value and node, to test album.
                if( nKey !== track.albumKey ){
                    storage.albums.old.push(track.albumKey);
                    storage.albums.new.push({key: nKey, node: node});
                    chunk.push(buildTracksToRecord( node, meta, track.albumKey, 'update' ));
                }
            }
            // If track no exist, index it.
            else {
                storage.genres.new = storage.genres.new.concat(meta.genre);
                storage.artist.new.push(meta.artist);
                storage.albums.new.push({key: nKey, node: node});
                chunk.push(buildTracksToRecord( node, meta, nKey ));
            }
        }
    }
}

function* switchActionOnAlbumsWithTracks(keys, withTracks, withoutTracks){

    let params = {
        body: {query: {match : {albumKey : ''}}},
        _sourceInclude: ['meta.artist', 'meta.genre'],
    };

    for( let i = 0, l = keys.length; i < l; i++ ) {
        params.body.query.match.albumKey = keys[i];
        const data = yield promiseSimpleSearch('tracks', params);
        if( data.hits.total === 0 ){
            withoutTracks(keys[i]);
            continue;
        }
        withTracks(keys[i], data.hits.hits);
    }
}

function switchActionOnDocsExist(docs, callExist, callNoExist) {
    for(let i = 0, l = docs.length; i < l; i++) {
        if( docs[i].found ) {
            callExist(i, docs[i]._id);
        }
        else{
            callNoExist(i, docs[i]._id);
        }
    }
}

function extractExistingDocs(docs) {
    const exists = {};
    for(let i = 0, l = docs.length; i < l; i++) {
        if( docs[i].found ) {
            exists[docs[i]._id] = docs[i]._source;
        }
    }
    return exists;
}


// function testAlbum() {
//
// }
//
// function testAlbum() {
//
// }
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
function runIndexElastic( fullLogs ) {

    return function( onError, onStep, onDone ) {

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
        function* run() {

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
            function* proceedOneByOneChunks() {

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

function promiseProceedChunk( chunk, onStep, onDone ){
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

function* loopOnChunk(chunk, onStep, onDone) {

    // Max number operations to bulk at same time.
    const chunkMaxSize = config.index.sizeChunkElastic;
    // Init bulk index operation number.
    let chunkCount = 0;
    // Start loop.
    while( chunk.length > 0 ){

        const part = _obj.splitTab( chunk, chunkMaxSize );

        yield promiseProceedChunk(
            part,
            () => {
                // Before send elastic api request.
                // Increment chunk index counter.
                chunkCount++;
                // Set task runner step.
                onStep(chunkCount, part.length);
            },
            data => {
                // After index done in elastic.
                onDone(data, chunkCount, part.length);
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
function* clearIndices( indices, logs = [] ) {

    // Delete and re-build indexes.
    for(let i = 0, l = indices.length; i < l; i++) {

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


function getAlbumKeyFromTrackNodeMeta( meta ){
    let artistKEY = meta.albumartist || meta.artist;
    return ps.buildSeparator([artistKEY, meta.album, meta.disk.no], '___');
}

function normalizedMeta( node ){
    nMeta = Object.assign({}, node.meta);
    nMeta.artist = nMeta.artist ? nMeta.artist.toLowerCase() : null;
    nMeta.albumartist = nMeta.albumartist ? nMeta.albumartist.toLowerCase() : null;
    nMeta.album = nMeta.album ? nMeta.album.toLowerCase() : 'NO-META-ALBUM';
    nMeta.title = nMeta.title ? nMeta.title : node.publicName;
    return nMeta;
}


function extractDataFromMeta( node, keys, chunk ){

    const { alKeys, arKeys, geKeys } = keys;

    /************* Core ***************/
    const meta = normalizedMeta(node);

    // Create unique key for album.
    let albumKEY = getAlbumKeyFromTrackNodeMeta(meta);

    // Add track record.
    chunk.push(buildTracksToRecord( node, meta, albumKEY ));

    // If album tracks not yet created,
    // Create and push it in albums array.
    if( !alKeys[albumKEY] ) {
        chunk.push(buildAlbumToRecord( meta, albumKEY ));
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
        if( toUpdate.artist || toUpdate.genre ){
            chunk.push(buildBulkRecord( 'update', 'album', 'album', {doc: toUpdate}, albumKEY ));
        }
    }

    // let artistTest = artist ? artist.toLowerCase() : null;
    let artistTest = meta.artist;

    // Proceed artists list.
    if( !arKeys[artistTest] ) {
        arKeys[artistTest] = true;
        chunk.push(buildArtistToRecord(meta.artist));
    }

    // Proceed genre list.
    for(let i = 0; i < meta.genre.length; i++) {
        const gen = meta.genre[i];
        if( !geKeys[gen] ) {
            geKeys[gen] = true;
            chunk.push(buildGenreToRecord(gen));
        }
    }
}

function testAlbumNeedUpdate(album, newProps, toUpdate){
    // Get already registred album.
    const addGenre = testMergeArray(album.genre, newProps.genre);

    // Test if have to add tracks artist to album artist pool.
    if(album.artist.indexOf(newProps.artist) === -1) {
        album.artist.push(newProps.artist);
        toUpdate.artist = album.artist;
    }

    // Test if have to add tracks genre to album genre.
    if( addGenre ) {
        album.genre = addGenre;
        toUpdate.genre = addGenre;
    }
    return toUpdate;
}


function buildAlbumToRecord( meta, albumKEY ) {
    const _doc = {
        suggest: {
            input: meta.album,
        },
        name: meta.album,
        keyName: meta.album,
        artist: [meta.artist],
        albumartist: meta.albumartist,
        year: meta.year,
        disk: meta.disk,
        genre: meta.genre,
        key: albumKEY,
    };
    return buildBulkRecord( 'index', 'album', 'album', _doc, albumKEY );
}


function buildTracksToRecord( track, meta, albumKEY, action = 'index' ) {
    const _doc = {
        suggest: {
            input: meta.title,
        },
        tracksId: track._id,
        path: track.path,
        name: track.name,
        publicName: track.publicName,
        meta: meta,
        albumKey: albumKEY,
    };
    return buildBulkRecord( action, 'tracks', 'tracks', _doc, track._id );
}

function buildArtistToRecord( artist ) {
    const _doc = {
        suggest: {
            input: artist,
        },
        name: artist,
        keyName: artist,
    };
    return buildBulkRecord( 'index', 'artist', 'artist', _doc );
}

function buildGenreToRecord( genre ) {
    const _doc = {
        suggest: {
            input: genre,
        },
        name: genre,
        keyName: genre,
    };
    return buildBulkRecord( 'index', 'genre', 'genre', _doc );
}

function buildBulkRecord( action, _index, _type, _doc, _id ) {
    const record = {
        action_type: action,
        _index: _index,
        _type: _type,
        _id: _id
    };
    if(_doc) record._doc = _doc;
    return record;
}

function testMergeArray(arr1, arr2) {
    // Concat arr1 and 2, remove clones
    const newArray = _.uniq(arr1.concat(arr2));
    // If more entry, return concat array.
    if( newArray.length !== arr1.length ) {
        return newArray;
    }
    return false;
}

function promiseSimpleSearch( index, body ) {
    return new Promise( (resolve, reject) => {
        simpleSearch(index, body, (err, data) => {
            if(err) return reject(err);
            resolve(data);
        });
    });
}


function promiseDocFromId(index, id){
    return new Promise( (resolve, reject) => {
        getDocFromId(index, id, (err, data) => {
            if(err) return reject(err);
            resolve(data);
        });
    });
}

function promiseMultiDocFromId(index, ids){
    return new Promise( (resolve, reject) => {
        getMultiDocFromId(index, ids, (err, data) => {
            if(err) return reject(err);
            resolve(data);
        });
    });
}

function promiseMultiDocFromNodes(index, nodes) {
    const ids = nodes.map(node => node._id);
    return promiseMultiDocFromId(index, ids);
}

function getDocFromId(index, id, callback) {

    const params = {
        index: index,
        type: index,
        id: id
    };

    es.get( params, (err, data) => {
        if(err) return callback(err);
        callback(null, data);
    });
}

function simpleSearch(index, params, callback) {

    const pars = Object.assign({index: index, type: index}, params);

    es.search( pars, (err, data) => {
        if(err) return callback(err);
        callback(null, data);
    });
}

function getMultiDocFromId(index, ids, callback) {

    const params = {
        _sourceExclude: 'suggest',
        index: index,
        type: index,
        body: {
            ids: ids
        }
    };

    es.mget( params, (err, data) => {
        if(err) return callback(err);
        callback(null, data.docs);
    });
}

function getSortValues(query){
    if( !query ) return [];
    return query.split('+');
}

function getFilterValues(key, query){
    const r = [];
    if(query) {
        const f = query.split('+');
        for(let i = 0, l = f.length; i < l; i++){
            r.push({term:{[key]:f[i]}});
        }
    }
    return r;
}

function getFilterRangeValues(key, query){
    const r = [];
    if(query) {
        const ranges = query.split('+');
        for(let i = 0, l = ranges.length; i < l; i++){
            const range = ranges[i].split('to');
            r.push({
                range:{
                    [key]:{
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

function getFiltersFromQuery(query){

    let filters = [];

    // Start loop query object checking.
    for(let key in query){
        if( query.hasOwnProperty( key ) ) {
            const f = key.replace(/^(filter.)/g, '');
            // Check if 'filter.' key in query.
            if (f !== key) {
                const rf = f.replace(/^(range.)/g, '');
                // Check if 'filter.range.' key in query.
                if (rf !== f) {
                    // Build filter range type array.
                    filters = filters.concat(getFilterRangeValues(rf, query[key]));
                } else {
                    // Build filter text type array.
                    filters = filters.concat(getFilterValues(f, query[key]));
                }
            }
        }
    }

    return filters;
}

exports.search = function(req, res, next) {

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
    if( terms !== '' ) {
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
    if(filters.length) {
        base_query = {
            bool: {
                must: query_query,
                filter: {
                    bool: {
                        should: filters,
                    },
                },
            },
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
                excludes: ['suggest'],
            },
        }
    };

    // Send search to elastic server.
    es.search( params, (err, data) => {
        if(err) return errorHandler.errorMessageHandler(err, req, res, next);

        res.json({
            success: true,
            msg: data,
        });
    });
};

exports.suggest = function (req, res, next) {

    const index = ps.clean(req.params.type);
    let terms = ps.clean(req.query.q);

    const base_query = {
        _source: 'suggest',
        suggest: {
            testSuggest : {
                prefix : terms,
                completion : {
                    field : 'suggest',
                    size: 10,
                }
            }
        }
    };

    const params = {
        index: index,
        body: base_query
    };


    es.search( params, (err, data) => {
        if(err) return errorHandler.errorMessageHandler(err, req, res, next);

        res.json({
            success: true,
            msg: data,
        });
    });
};


function initIndexLog(counter, fullLog){

    return function(data) {

        const index_error_array = [];
        const update_error_array = [];

        let index_error_count = 0;
        let update_error_count = 0;
        let index_success_count = 0;
        let update_success_count = 0;

        try {
            for (let i = 0, l = data.items.length; i < l; i++) {
                const item = data.items[i];
                if (item.index) {

                    if( !counter[item.index._index + '_success'] ) {
                        counter[item.index._index + '_success'] = 0;
                        counter[item.index._index + '_errors'] = 0;
                    }

                    if (item.index.error) {
                        index_error_count++;
                        counter[item.index._index + '_errors']++;
                        if(fullLog) index_error_array.push(item.index);
                        continue;
                    }
                    index_success_count++;
                    counter[item.index._index + '_success']++;
                }

                else if (item.update) {
                    if (item.update.error) {
                        update_error_count++;
                        if(fullLog) update_error_array.push(item.update);
                        continue;
                    }
                    update_success_count++;
                }
            }

            const logs = {
                index: {
                    success_count: index_success_count,
                    errors_count: index_error_count,
                    errors: index_error_array,
                },
                update: {
                    success_count: update_success_count,
                    errors_count: update_error_count,
                    errors: update_error_array,
                }
            };

            if(fullLog) {
                logs.index.errors = index_error_array;
                logs.update.errors = update_error_array;
            }

            return logs;
        }
        catch (e) {
            return `Bulk index OK. Building logs error : ${e.message}`;
        }
    }
}