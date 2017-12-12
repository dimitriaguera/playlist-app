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

const Node = require(path.resolve('./modules/indexableFolder/server/models/indexableFolder.server.models'));
const ps = require(path.resolve('./modules/indexableFolder/server/services/path.server.services'));
const es = require(path.resolve('./modules/indexableFolder/server/elastic/elasticsearch'));



exports.index = function (req, res, next) {

    Node.find({isFile: true}).select('path meta').lean().exec((err, data) => {
        if(err) return errorHandler.errorMessageHandler(err, req, res, next);

        const tracks = [];
        const albums = [];
        const artists = [];
        const genres = [];

        const alKeys = {};
        const arKeys = {};
        const geKeys = {};

        data.map((item, i) => {

            let title = item.meta.title || item.meta.TITLE || '';
            let album = item.meta.album || item.meta.ALBUM || '';
            let date = item.meta.date || item.meta.DATE || '';
            let artist = item.meta.artist || item.meta.ARTIST || '';
            let disc = item.meta.disc || item.meta.DISC || '';
            let genre = item.meta.genre || item.meta.GENRE || '';

            // Split genre and artist field in array.
            genre = genre.split(/\s*[,;\/]\s*/);
            //artist = artist.split(/\s*[,]\s*/);

            const meta = {
                suggest: {
                    input: title,
                },
                title: title,
                album: album,
                artist: artist,
                date: date,
                disc: disc,
                genre: genre,
                path: ps.removeLast(item.path),
            };

            tracks.push({
                suggest: {
                    input: title,
                },
                tracksId: item._id,
                path: item.path,
                meta: meta,
            });

            // Here start test to filter albums and artists.
            // Test key string.
            let albumID = album + disc;

            // If album tracks not yet created,
            // Create and pusht it in albums array.
            if( !alKeys[albumID] ) {
                albums.push({
                    suggest: {
                        input: album,
                    },
                    name: album,
                    keyName: album,
                    artist: [artist],
                    date: date,
                    disc: disc,
                    genre: genre,
                    path: ps.removeLast(item.path),
                });
                alKeys[albumID] = albums.length;
            }

            // If album tracks already in album array.
            else {
                // Get the already registered album.
                const currentAlbum = albums[alKeys[albumID] - 1];

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

            // Proceed artists list.
            if( !arKeys[artist] ) {
                arKeys[artist] = true;
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

        //return res.json({genre: genres});

        es.indexDelete(['album', 'artist', 'tracks', 'genre'], (err, resp) => {

            if(err) return errorHandler.errorMessageHandler(err, req, res, next);

            const bodyAlbum = {
                // "settings": {
                //     "index.mapping.ignore_malformed": true,
                // },
                "mappings": {
                    "album": {
                        "properties": {
                            "suggest" : {
                                "type" : "completion",
                                "contexts": [
                                    {
                                        "name": "genre",
                                        "type": "category",
                                        "path": "genre"
                                    },
                                    {
                                        "name": "artist",
                                        "type": "category",
                                        "path": "artist"
                                    }
                                ],
                            },
                            "name": {
                                "type": "text"
                            },
                            "keyName": {
                                "type": "keyword"
                            },
                            "artist": {
                                "type": "keyword"
                            },
                            "date": {
                                "type":   "date",
                                "format": "yyyy||yyyy-MM-dd",
                                "ignore_malformed": "true"
                            },
                            "disc": {
                                "type": "keyword"
                            },
                            "genre": {
                                "type": "keyword"
                            },
                        }
                    },
                }
            };

            const bodyTracks = {
                // "settings": {
                //     "index.mapping.ignore_malformed": true,
                // },
                "mappings": {
                    "tracks": {
                        "properties": {
                            "suggest" : {
                                "type" : "completion",
                                "contexts": [
                                    {
                                        "name": "genre",
                                        "type": "category",
                                        "path": "meta.genre"
                                    },
                                    {
                                        "name": "artist",
                                        "type": "category",
                                        "path": "meta.artist"
                                    },
                                    {
                                        "name": "album",
                                        "type": "category",
                                        "path": "meta.album"
                                    },
                                ],
                            },
                            "tracksId": {
                                "type": "keyword"
                            },
                            "path": {
                                "type": "keyword"
                            },
                            "meta": {
                                "title": {
                                    "type": "text"
                                },
                                "album": {
                                    "type": "keyword"
                                },
                                "artist": {
                                    "type": "keyword"
                                },
                                "date": {
                                    "type":   "date",
                                    "format": "yyyy||yyyy-MM-dd",
                                    "ignore_malformed": "true"
                                },
                                "disc": {
                                    "type": "keyword"
                                },
                                "genre": {
                                    "type": "keyword"
                                },
                            }
                        }
                    },
                }
            };

            const bodyArtist = {
                // "settings": {
                //     "index.mapping.ignore_malformed": true,
                // },
                "mappings": {
                    "artist": {
                        "properties": {
                            "suggest" : {
                                "type" : "completion"
                            },
                            "name": {
                                "type": "text"
                            },
                            "keyName": {
                                "type": "keyword"
                            },
                        }
                    },
                }
            };

            const bodyGenre = {
                // "settings": {
                //     "index.mapping.ignore_malformed": true,
                // },
                "mappings": {
                    "genre": {
                        "properties": {
                            "suggest" : {
                                "type" : "completion"
                            },
                            "name": {
                                "type": "text"
                            },
                            "keyName": {
                                "type": "keyword"
                            },
                        }
                    },
                }
            };

            // Create album index.
            es.indexCreate({index:'album', body:bodyAlbum}, () => {
                if(err) return errorHandler.errorMessageHandler(err, req, res, next);

                let param = {
                    index:'album',
                    type:'album',
                };

                // Index all albums.
                es.indexBulk(albums, param, (err, respAlb) => {
                    if(err) return errorHandler.errorMessageHandler(err, req, res, next);

                    // Create artist index.
                    es.indexCreate({index:'artist', body:bodyArtist}, () => {
                        if(err) return errorHandler.errorMessageHandler(err, req, res, next);

                        let param = {
                            index:'artist',
                            type:'artist',
                        };

                        // Index all artists.
                        es.indexBulk(artists, param, (err, respArt) => {
                            if(err) return errorHandler.errorMessageHandler(err, req, res, next);

                            // Create tracks index.
                            es.indexCreate({index:'tracks', body:bodyTracks}, () => {
                                if(err) return errorHandler.errorMessageHandler(err, req, res, next);

                                let param = {
                                    index:'tracks',
                                    type:'tracks',
                                };

                                // Index all tracks.
                                es.indexBulk(tracks, param, (err, respTrack) => {
                                    if(err) return errorHandler.errorMessageHandler(err, req, res, next);

                                    // Create genre index.
                                    es.indexCreate({index:'genre', body:bodyGenre}, () => {
                                        if(err) return errorHandler.errorMessageHandler(err, req, res, next);

                                        let param = {
                                            index:'genre',
                                            type:'genre',
                                        };

                                        // Index all genres.
                                        es.indexBulk(genres, param, (err, respGen) => {
                                            if(err) return errorHandler.errorMessageHandler(err, req, res, next);

                                            res.json({
                                                success: true,
                                                msg: {
                                                    album: getIndexLogError(respAlb),
                                                    artist: getIndexLogError(respArt),
                                                    tracks: getIndexLogError(respTrack),
                                                    genre: getIndexLogError(respGen),
                                                },
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};


exports.update = function(req, res, next) {

};

exports.delete = function(req, res, next) {

};

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

exports.search = function (req, res, next) {

    const index = ps.clean(req.params.type);
    const exact = req.query.exact;
    const from = req.query.from ? ps.clean(req.query.from) : 0;
    const size = req.query.size ? ps.clean(req.query.size) : 1000;
    const field = req.query.fi ? ps.clean(req.query.fi) : 'name';

    const artist = getFilterValues( 'artist', req.query.artist);
    const genre = getFilterValues( 'genre', req.query.genre);
    const date = getFilterRangeValues( 'date', req.query.date);

    let terms = ps.clean(req.query.q);
    terms = exact ? `"${terms}"` : terms + '*';

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
    if(artist.length || genre.length || date.length) {
        base_query = {
            bool: {
                must: query_query,
                filter: {
                    bool: {
                        should: [].concat(artist, genre, date),
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
        //sort: 'keyName:asc',
        body: {
            from: from,
            size: size,
            query: base_query,
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