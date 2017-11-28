/**
 * Created by Dimitri Aguera on 30/09/2017.
 */
const fs = require('fs');
const async = require('async');
const path = require('path');
const config = require(path.resolve('./config/env/config.server'));
const errorHandler = require(path.resolve('./modules/core/server/services/error.server.services'));

const Node = require(path.resolve('./modules/indexableFolder/server/models/indexableFolder.server.models'));
const ps = require(path.resolve('./modules/indexableFolder/server/services/path.server.services'));
const es = require(path.resolve('./modules/indexableFolder/server/elastic/elasticsearch'));



exports.index = function (req, res, next) {

    Node.find({isFile: true}).select('-_id path meta').lean().exec((err, data) => {
        if(err) return errorHandler.errorMessageHandler(err, req, res, next);

        const albums = [];
        const artists = [];

        const alKeys = {};
        const arKeys = {};

        data.map((item, i) => {

            let album = item.meta.album || item.meta.ALBUM || '';
            let date = item.meta.date || item.meta.DATE || '';
            let artist = item.meta.artist || item.meta.ARTIST || '';
            let disc = item.meta.disc || item.meta.DISC || '';
            let genre = item.meta.genre || item.meta.GENRE || '';

            let albumID = album + disc;

            if( !alKeys[albumID] ) {

                albums.push({
                    name: album,
                    artist: artist,
                    date: date,
                    disc: disc,
                    genre: genre,
                });
                alKeys[albumID] = albums.length;

            }
            else if(albums[alKeys[albumID] - 1].artist !== artist){
                albums[alKeys[albumID] - 1].artist += `, ${artist}`
            }

            if( !arKeys[artist] ) {
                arKeys[artist] = true;
                artists.push({
                    name: artist,
                });
            }
        });

        es.indexDelete(['album', 'artist'], (err, resp) => {

            if(err) return errorHandler.errorMessageHandler(err, req, res, next);

            const  bodyAlbum = {
                "mapping": {
                    "album": {
                        "properties": {
                            "name": {
                                "type": "text"
                            },
                            "artist": {
                                "type": "text"
                            },
                            "date": {
                                "type": "text"
                            },
                            "disc": {
                                "type": "text"
                            },
                            "genre": {
                                "type": "text"
                            },
                        }
                    },
                }
            };

            const  bodyArtist = {
                "mapping": {
                    "album": {
                        "properties": {
                            "name": {
                                "type": "text"
                            },
                        }
                    },
                }
            };

            es.indexCreate({index:'album', body:bodyAlbum}, () => {
                if(err) return errorHandler.errorMessageHandler(err, req, res, next);

                let param = {
                    index:'album',
                    type:'album',
                };

                es.indexBulk(albums, param, (err, respAlb) => {
                    if(err) return errorHandler.errorMessageHandler(err, req, res, next);

                    es.indexCreate({index:'artist', body:bodyArtist}, () => {
                        if(err) return errorHandler.errorMessageHandler(err, req, res, next);

                        let param = {
                            index:'artist',
                            type:'artist',
                        };

                        es.indexBulk(artists, param, (err, respArt) => {
                            if(err) return errorHandler.errorMessageHandler(err, req, res, next);

                            res.json({
                                success: true,
                                msg: {
                                    albums: {errors: respAlb.errors},
                                    artists: {errors: respArt.errors},
                                },
                            });
                        });
                    });
                });
            });
        });
    });
};

// exports.index = function (req, res, next) {
//
//     Node.find({}).select('-_id name path meta isFile publicName').lean().exec((err, data) => {
//         if(err) return errorHandler.errorMessageHandler(err, req, res, next);
//
//         es.indexDelete('folder', (err, resp) => {
//             if(err) return errorHandler.errorMessageHandler(err, req, res, next);
//
//             const param = {
//                 index:'folder',
//                 type:'album',
//             };
//
//             es.indexBulk(data, param, (err, data) => {
//                 if(err) return errorHandler.errorMessageHandler(err, req, res, next);
//
//                 res.json({
//                     success: true,
//                     msg: data,
//                 });
//             });
//         });
//     });
// };

exports.update = function(req, res, next) {

};

exports.delete = function(req, res, next) {

};

exports.search = function (req, res, next) {

    const NOT_SECURE_STRING_SEARCH = req.query.q;
    const NOT_SECURE_STRING_FI = req.query.fi;

    // const NOT_SECURE_STRING_TI = req.query.ti;
    // const NOT_SECURE_STRING_AR = req.query.ar;
    // const NOT_SECURE_STRING_AL = req.query.al;
    // const NOT_SECURE_STRING_DA = req.query.da;

    const index = ps.clean(req.params.type);
    const terms = ps.clean(NOT_SECURE_STRING_SEARCH);
    const field = ps.clean(NOT_SECURE_STRING_FI);

    const base_query = {
        query_string: {
            query: `${terms}*`,
            fields: [field],
            default_operator: 'AND'
        }
    };

    const params = {
        index: index,
        type: index,
        body: {
            size: 3000,
            from: 0,
            query: base_query,
        }
    };

    // if (ot === 'true') {
    //     params.body.query = {
    //         bool: {
    //             must: base_query,
    //             filter: {
    //                 term: {isFile: true}
    //             }
    //         }
    //     }
    // }

    es.search( params, (err, data) => {
        if(err) return errorHandler.errorMessageHandler(err, req, res, next);

        res.json({
            success: true,
            msg: data,
        });
    });
};

