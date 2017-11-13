/**
 * Created by Dimitri Aguera on 30/09/2017.
 */
const fs = require('fs');
const async = require('async');
const path = require('path');
const config = require(path.resolve('./config/env/config.server'));
const errorHandler = require(path.resolve('./modules/core/server/services/error.server.services'));

const ps = require(path.resolve('./modules/indexableFolder/server/services/path.server.services'));
const Node = require(path.resolve('./modules/indexableFolder/server/models/indexableFolder.server.models'));

const log = require('single-line-log').stdout;




let indexCount = 0;

exports.index = function (req, res, next) {

    const DRIVE = config.folder_base_url;
    //const NOT_SECURE_STRING = req.query.path;

    //const query = ps.cleanPath(NOT_SECURE_STRING);
    //const path = `${DRIVE}${query}`;

    const path = `${DRIVE}`;

    indexCount = 0;
    log(`Successful indexed ${indexCount} files`);
    log.clear();

    walkAsync( path, null, null, null, false, (err) => {
        if(err){
            res.status(404);
            return errorHandler.errorMessageHandler(err, req, res, next, 'File not found.');
        }
        res.json({
            success: true,
            msg: 'Starting indexation.',
        });
    });
};

/**
 * Recursive search of all files inside an item.
 * Item can be a file or a folder.
 * All files/folders are saved in db as Node document.
 *
 * @param path String - item path.
 * @param name String - item name
 * @param callback Function - func called when item's Node document is saved. Call with args: callback( err, Node._id )
 * @param parentId _id - item's parent Node id.
 * @param isFile Boolean - false if item is folder, true if item is file.
 * @param done Function - func called after first search iteration.
 * @returns {*}
 */
function walkAsync( path, name, callback, parentId, isFile, done ) {

    const regexFile = config.fileSystem.fileAudioTypes;
    const regexSecure = config.security.secureFile;

    let node = new Node({
        name: name || 'root',
        path: path,
        parent: parentId || null,
        isFile: isFile,
    });

    if( isFile ) {

        if ( !(regexSecure.test(name) && regexFile.test(name)) ) {
            return callback( null, null );
        }

        return node.save((err) => {
            if (err) {
                return errorHandler.logsError(err);
            }
            indexCount++;
            log(`Successful indexed ${indexCount} files`);
            log.clear();
            callback( err, node._id );
        });
    }

    fs.readdir(path, (err, dir) => {

        if (err) {
            if(!parentId){
                return done(err);
            }
            return errorHandler.logsError(err);
        }

        node.save((err) => {

            if (callback) callback(err, node._id);

            async.map(dir, function iterator(item, innerCallback) {

                let nodePath = `${path}/${item}`;

                fs.lstat(nodePath, (err, stats) => {

                    if (err) {
                        return errorHandler.logsError(err);
                    }

                    walkAsync(nodePath, item, innerCallback, node._id, stats.isFile());
                });

            }, function (err, nodesChildrenId) {

                if (err) {
                    return errorHandler.logsError(err);
                }

                node.children = nodesChildrenId.filter(id => id !== null);

                node.save((err) => {
                    if(err) {
                        return errorHandler.logsError(err);
                    }
                    indexCount++;
                    log(`Successful indexed ${indexCount} files`);
                    log.clear();
                });
            });
        });

        if(!parentId){
            done();
        }
    });
}

// exports.index = function (req, res) {
//
//     const DRIVE = config.folder_base_url;
//     const NOT_SECURE_STRING = req.query.path;
//
//     const query = ps.cleanPath(NOT_SECURE_STRING);
//     const path = `${DRIVE}${query}`;
//
//     const regexFile = config.fileSystem.fileAudioTypes;
//     const regexSecure = config.security.secureFile;
//
//     fs.readdir( path, ( err, dir ) => {
//
//         if ( err ) {
//             console.log(err.message);
//             return res.status(401).json({
//                     success: false,
//                     msg: 'Folder not found',
//                 });
//         }
//
//         async.map(dir, function iterator( item, callback ){
//
//             fs.lstat( `${path}/${item}`, (err, stats) => {
//
//                 let result = {};
//
//                 if( !err ) {
//
//                     if ( stats.isFile() ) {
//
//                         if ( !(regexSecure.test(item) && regexFile.test(item)) ) {
//                             result = null;
//                         }
//
//                         else {
//                             result = {
//                                 authorized: true,
//                                 isFile: true,
//                                 name: item,
//                                 publicName: item.replace(regexFile, ''),
//                             };
//                         }
//                     }
//
//                     else {
//                         result = {
//                             authorized: true,
//                             isFile: false,
//                             name: item,
//                         };
//                     }
//                 }
//
//                 return callback( err, result );
//
//             });
//
//         }, function( err, results ){
//
//             if ( err ) {
//                 console.log( err.message );
//                 return res.json({
//                     success: false,
//                     msg: err.message,
//                 });
//             }
//
//             return res.json({
//                 success: true,
//                 msg: results,
//             });
//         });
//     });
// };

// exports.searchSyncFiles = function(req, res, next) {
//
//     const DRIVE = config.folder_base_url;
//     const NOT_SECURE_STRING = req.query.path;
//
//     const query = ps.cleanPath(NOT_SECURE_STRING);
//     const path = `${DRIVE}${query}`;
//
//     // Call recursive search.
//     walk( path, function(err, results) {
//
//         if ( err ) {
//
//             res.status(401);
//             return errorHandler.errorMessageHandler( err, req, res, next, `Can't read file.` );
//         }
//
//         return res.json({
//             success: true,
//             msg: results,
//         });
//     }, query);
// };
//
//
// /**
//  * Recursive search of all files inside a root folder.
//  * Dir is the root folder path.
//  * Done is the callback called with all results.
//  * P is the initial root folder name.
//  *
//  * @param dir
//  * @param done
//  * @param p
//  */
// const walk = function(dir, done, p) {
//
//     const regexFile = config.fileSystem.fileAudioTypes;
//     const regexSecure = config.security.secureFile;
//
//     let results = [];
//
//     fs.readdir(dir, function(err, list) {
//
//         if (err) return done(err);
//
//         let i = 0;
//
//         (function next() {
//
//             let name = list[i++];
//
//             if (!name) return done(null, results);
//
//             let relPath = p + '/' + name;
//             let file = dir + '/' + name;
//
//             fs.stat(file, function(err, stat) {
//                 if (stat && stat.isDirectory()) {
//                     walk(file, function(err, res) {
//                         results = results.concat(res);
//                         next();
//                     }, relPath);
//                 } else {
//                     if ( regexSecure.test(name) && regexFile.test(name) ){
//                         results.push({src: relPath, name: name.replace(regexFile, '')});
//                     }
//                     next();
//                 }
//             });
//         })();
//     });
// };
//
//
//
