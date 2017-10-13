/**
 * Created by Dimitri Aguera on 30/09/2017.
 */
const fs = require('fs');
const async = require('async');
const path = require('path');
const config = require(path.resolve('./config/env/config.server'));
const errorHandler = require(path.resolve('./modules/core/server/services/error.server.services'));

exports.open = function (req, res) {

    //const drive = process.env.SystemDrive;

    const drive = config.folder_base_url;
    const query = req.query.path;
    const path = `${drive}/${query}`;

    //console.log(path);
    //console.log(process.env);

    fs.readdir( path, ( err, dir ) => {

        if ( err ) {
            console.log(err.message);
            return res.status(401).json({
                    success: false,
                    msg: 'Folder not found',
                });
        }

        async.map(dir, function iterator( item, callback ){

            fs.lstat( `${path}/${item}`, (err, stats) => {

                let result = {};

                if( !err ) {

                    if ( stats.isFile() ) {

                        if ( !config.fileSystem.fileAudioTypes.test(item) ) {
                            result = null;
                        }

                        else {
                            result = {
                                authorized: true,
                                isFile: true,
                                name: item,
                            };
                        }
                    }

                    else {
                        result = {
                            authorized: true,
                            isFile: false,
                            name: item,
                        };
                    }
                }

                return callback( err, result );

            });

        }, function( err, results ){

            if ( err ) {
                console.log( err.message );
                return res.json({
                    success: false,
                    msg: err.message,
                });
            }

            return res.json({
                success: true,
                msg: results,
            });
        });
    });
};

exports.searchSyncFiles = function(req, res, next) {

    const drive = config.folder_base_url;
    const query = req.query.path;
    const path = `${drive}z/${query}`;

    // Call recursive search.
    walk( path, function(err, results) {

        if ( err ) {

            res.status(401);
            return errorHandler.errorMessageHandler( err, req, res, next, `Can't read file.` );
        }

        return res.json({
            success: true,
            msg: results,
        });
    }, query);
};


/**
 * Recursive search of all files inside a root folder.
 * Dir is the root folder path.
 * Done is the callback called with all results.
 * P is the initial root folder name.
 *
 * @param dir
 * @param done
 * @param p
 */
const walk = function(dir, done, p) {

    let results = [];

    fs.readdir(dir, function(err, list) {

        if (err) return done(err);

        let i = 0;

        (function next() {

            let name = list[i++];

            if (!name) return done(null, results);

            let relPath = p + '/' + name;
            let file = dir + '/' + name;

            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function(err, res) {
                        results = results.concat(res);
                        next();
                    }, relPath);
                } else {
                    if ( config.fileSystem.fileAudioTypes.test(file) ){
                        results.push({src: relPath, name: name});
                    }
                    next();
                }
            });
        })();
    });
};

