/**
 * Created by Dimitri Aguera on 30/09/2017.
 */
const fs = require('fs');
const async = require('async');
const path = require('path');
const url = require('url');
const _ = require('lodash');
const config = require(path.resolve('./config/env/config.server'));
const errorHandler = require(path.resolve('./modules/core/server/services/error.server.services'));
const taskRunner = require(path.resolve('./modules/task/server/services/task.server.services'));
const Node = require(path.resolve('./modules/indexableFolder/server/models/indexableFolder.server.models'));
const ps = require(path.resolve('./modules/core/client/services/core.path.services'));
const es = require(path.resolve('./modules/indexableFolder/server/elastic/elasticsearch'));
const indices_body = require(path.resolve('./modules/indexableFolder/server/elastic/mappings.server.elastic'));


exports.index = function(req, res, next){

    // Create taskRunner instance.
    const runTask = taskRunner.create(req, res, next);

    // Start Task.
    runTask(
        {
            name:'index elastic',
            unique: true
        },
        runIndexElastic
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
function runIndexElastic(onError, onStep, onDone) {

    // Get all files nodes.
    Node.find({isFile: true}).select('path meta name publicName').lean().exec((err, data) => {

        // Return if error.
        if(err) return onError(err);

        const logs = {};

        // Parse albums, artists, and genres from all tracks metadata.
        const bulk_data = extractDataFromMeta(data);

        // return res.json({yo: bulk_data.albums});

        // Set params for index we need to create.
        const indices = [
            {
                index: 'album',
                data: bulk_data.albums,
                body: indices_body.album_body
            },
            {
                index: 'artist',
                data: bulk_data.artists,
                body: indices_body.artist_body
            },
            {
                index: 'tracks',
                data: bulk_data.tracks,
                body: indices_body.tracks_body
            },
            {
                index: 'genre',
                data: bulk_data.genres,
                body: indices_body.genre_body
            },
        ];

        // Build index creation sequence.
        let func = indices.map( ({index, data, body}) => [
            function(cb){
                onStep(`deleting ${index} index...`);
                es.indexDelete([index], (e, r) => {
                    cb(e, `index ${index} deleted at ${itIsNow()}`);
                });
            },
            function(cb){
                onStep(`creating ${index} index...`);
                es.indexCreate({index:index, body:body}, (e, r) => {
                    cb(e, `index ${index} created at ${itIsNow()}`);
                });
            },
            function(cb){
                onStep(`populating ${index} index...`);
                es.indexBulk(data, {index:index,type:index}, (e, r) => {
                    logs[index] = getIndexLogError(r);
                    cb(e, `index ${index} data added at ${itIsNow()} - ${logs[index].index_count} documents successful indexed - ${logs[index].error_count} document rejected`);
                });
            },
        ]);
        func = _.flatten(func);

        // Start indexation.
        async.series(func, (e, result) => {
            if(e) return onError(e);
            onDone({steps:result, details:logs});
        });
    });
}

function itIsNow(){
    const now = new Date();
    return `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
}


function extractDataFromMeta(data){

    const tracks = [];
    const albums = [];
    const artists = [];
    const genres = [];

    const alKeys = {};
    const arKeys = {};
    const geKeys = {};

    data.map((item, i) => {

        /************* Core ***************/
        let { title, album, year, artist, genre, track, disk } = item.meta;

        /*********** Facultatif *************/
        let { composer, albumartist } = item.meta;

        /*********** STRING NORMALIZATION ************/
        artist = artist ? artist.toLowerCase() : null;
        albumartist = albumartist ? albumartist.toLowerCase() : null;
        album = album ? album.toLowerCase() : 'NO-META-ALBUM';

        // Meta.field must not be null or empty, because of elasticsearch tracks mapping.
        // If no value, give file name for default value.
        title = title ? title : item.publicName;

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

        // Add track.
        tracks.push({
            suggest: {
                input: title,
            },
            tracksId: item._id,
            path: item.path,
            name: item.name,
            publicName: item.publicName,
            meta: meta,
            albumKey: albumKEY,
        });

        // If album tracks not yet created,
        // Create and pusht it in albums array.
        if( !alKeys[albumKEY] ) {
            albums.push({
                suggest: {
                    input: album,
                },
                name: album,
                keyName: album,
                artist: [artist],
                albumartist: albumartist,
                year: year,
                disk: disk,
                genre: genre,
                path: ps.removeLast(item.path),
                key: albumKEY,
            });
            alKeys[albumKEY] = albums.length;
        }

        // If album tracks already in album array.
        else {
            // Get the already registered album.
            const currentAlbum = albums[alKeys[albumKEY] - 1];

            // Add and tracks genre on album.
            currentAlbum.genre.concat(genre);
            // Remove clones.
            _.uniq(currentAlbum.genre);

            // // Add and artist.
            // currentAlbum.artist.concat(artist);
            // // Remove clones.
            // _.uniq(currentAlbum.artist);


            // Test if current tracks artist is already in album artist field.
            if(currentAlbum.artist.indexOf(artist) === -1){
                // Add tracks artist on album.
                currentAlbum.artist.push(artist);
            }
        }

        // let artistTest = artist ? artist.toLowerCase() : null;
        let artistTest = artist;

        // Proceed artists list.
        if( !arKeys[artistTest] ) {
            arKeys[artistTest] = true;
            artists.push({
                suggest: {
                    input: artist,
                },
                name: artist,
                keyName: artist,
            });
        }

        // Proceed genre list.
        for(let i = 0; i < genre.length; i++) {
            //const gen = genre[i] ? genre[i].toLowerCase() : null;
            const gen = genre[i];
            if( !geKeys[gen] ) {
                geKeys[gen] = true;
                genres.push({
                    suggest: {
                        input: gen,
                    },
                    name: gen,
                    keyName: gen,
                });
            }
        }
    });

    // Return data to index.
    return {
        tracks,
        albums,
        artists,
        genres,
    }
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
                    // contexts: {
                    //     artist: [ "", "Radiohead" ]
                    // }
                }
            }
        }
    };

    const params = {
        index: index,
        //type: index,
        //_sourceInclude: ['suggest'],
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

function safeQuote(str){
    //return `"${str}"`;
    return str;
}

function getIndexLogError(data){

    let count = 0;
    let i_count = 0;
    let array = [];

    for(let i = 0, l = data.items.length; i < l; i++){
        if(data.items[i].index.error) {
            count++;
            array.push(data.items[i].index);
            continue;
        }
        i_count++;
    }

    return {index_count: i_count, error_count: count, errors: array };
}