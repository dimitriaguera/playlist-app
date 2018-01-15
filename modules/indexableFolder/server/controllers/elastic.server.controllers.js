/**
 * Created by Dimitri Aguera on 30/09/2017.
 */
const co = require('co');
const path = require('path');
const _ = require('lodash');
const chalk = require('chalk');
const config = require(path.resolve('./config/env/config.server'));
const errorHandler = require(path.resolve('./modules/core/server/services/error.server.services'));
const taskRunner = require(path.resolve('./modules/task/server/services/task.server.services'));
const Node = require(path.resolve('./modules/indexableFolder/server/models/indexableFolder.server.models'));
const ps = require(path.resolve('./modules/core/client/services/core.path.services'));
const es = require(path.resolve('./modules/indexableFolder/server/elastic/elasticsearch'));
const indices_body = require(path.resolve('./modules/indexableFolder/server/elastic/mappings.server.elastic'));


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

/**
 * Start general indexation in elasticsearch from all tracks in nodes collection.
 * Album, artists and genre are extracted from all tracks metadata...
 * Create 4 index :
 * - album
 * - artist
 * - tracks
 * - genre
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
            yield clearIndices(logs, ['album', 'artist', 'tracks', 'genre']);

            // Start loop on mondoDB documents.
            for (let node = yield cursor.next(); node != null; node = yield cursor.next()) {
                // Create entities to index from each track node.
                extractDataFromMeta(node, keys, chunk);
                // Bulk index entities.
                yield proceedChunks();
            }

            // Function that test if chunk is big enought.
            // And start elastic bulk index process.
            function* proceedChunks() {

                // Get number of operations in current chunk.
                const chunkSize = chunk.length;

                // If chunk is bigger enought, start indexation process.
                if (chunkSize >= chunkMaxSize) {
                    yield new Promise((resolve, reject) => {
                        // Increment chunk index counter.
                        chunkCount++;
                        // Set task runner step.
                        onStep(`Start bulk index ${chunkCount}. Indexing ${chunkSize} documents...`);
                        // Start async bulk index process.
                        es.indexBulk(chunk, (err, data) => {
                            if (err) {
                                return reject(err);
                            }
                            // Clear chunk array.
                            chunk.splice(0, chunkSize);
                            // Log result.
                            logs.push({bulk_operation_number: chunkCount, bulk_size: chunkSize, ...getIndexLog(data)});
                            // Exit.
                            resolve();
                        });
                    });
                }
            }

            // Return logs to report.
            return {total_count: counter, logs: logs};
        }
    }
}

// Function that clear and create index.
function* clearIndices( logs, indices ) {

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
}

function extractDataFromMeta( node, keys, chunk ){

    const { alKeys, arKeys, geKeys } = keys;

    /************* Core ***************/
    let { title, album, year, artist, genre, track, disk, albumartist, composer } = node.meta;

    /*********** STRING NORMALIZATION ************/
    artist = artist ? artist.toLowerCase() : null;
    albumartist = albumartist ? albumartist.toLowerCase() : null;
    album = album ? album.toLowerCase() : 'NO-META-ALBUM';

    // Meta.field must not be null or empty, because of elasticsearch tracks mapping.
    // If no value, give file name for default value.
    title = title ? title : node.publicName;

    // Here start test to filter albums and artists.
    // Create unique key for artist.
    let artistKEY = albumartist || artist;
    // Create unique key for album.
    let albumKEY = ps.buildSeparator([artistKEY, album, disk.no], '___');

    // Create track meta.
    const meta = {
        title: title,
        album: album,
        artist: artist,
        albumartist: albumartist,
        year: year,
        disk: disk,
        genre: genre,
        track: track,
    };

    // Add track record.
    chunk.push(buildTracksToRecord( node, albumKEY, meta ));

    // if(albumKEY == ''){
    //     const ok = true;
    // }

    // If album tracks not yet created,
    // Create and push it in albums array.
    if( !alKeys[albumKEY] ) {
        chunk.push(buildAlbumToRecord( meta, albumKEY ));
        alKeys[albumKEY] = {
            artist: [artist],
            genre: genre
        };
    }

    // If album tracks already in album array.
    else {
        // Get already registred album.
        const currentAlbum = alKeys[albumKEY];
        const addGenre = testMergeArray(currentAlbum.genre, genre);
        const toUpdate = {};

        // Test if have to add tracks artist to album artist pool.
        if(currentAlbum.artist.indexOf(artist) === -1) {
            currentAlbum.artist.push(artist);
            toUpdate.artist = currentAlbum.artist;
        }

        // Test if have to add tracks genre to album genre.
        if( addGenre ) {
            currentAlbum.genre = addGenre;
            toUpdate.genre = addGenre;
        }

        // If need to update, push it in chunk array.
        if( toUpdate.artist || toUpdate.genre ){
            chunk.push(buildBulkRecord( 'update', 'album', 'album', {doc: toUpdate}, albumKEY ));
        }
    }

    // let artistTest = artist ? artist.toLowerCase() : null;
    let artistTest = artist;

    // Proceed artists list.
    if( !arKeys[artistTest] ) {
        arKeys[artistTest] = true;
        chunk.push(buildArtistToRecord(artist));
    }

    // Proceed genre list.
    for(let i = 0; i < genre.length; i++) {
        const gen = genre[i];
        if( !geKeys[gen] ) {
            geKeys[gen] = true;
            chunk.push(buildGenreToRecord(gen));
        }
    }
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

function buildTracksToRecord( track, albumKEY, meta ) {
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
    return buildBulkRecord( 'index', 'tracks', 'tracks', _doc, track._id );
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
    return {
        action_type: action,
        _index: _index,
        _type: _type,
        _id: _id,
        _doc: _doc
    };
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


exports.update = function(req, res, next) {

};

exports.delete = function(req, res, next) {

};

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