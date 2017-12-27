const path = require('path');
const config = require(path.resolve('./config/env/config.server'));
const errorHandler = require(path.resolve('./modules/core/server/services/error.server.services'));
const taskRunner = require(path.resolve('./modules/task/server/services/task.server.services'));
const es = require(path.resolve('./modules/indexableFolder/server/elastic/elasticsearch'));
const { readPictAndSave } = require(path.resolve('./modules/music/server/services/metaTag.server.services'));
const { saveToJpeg } = require(path.resolve('./modules/music/server/services/picture.server.services'));
const { splitTab } = require(path.resolve('./modules/core/server/services/obj.server.services'));
const async = require('async');
const fs = require("fs-extra");

const DRIVE = config.folder_base_url;
const PUBLIC_FILE = path.isAbsolute(config.public_base_url)?config.public_base_url:path.join(path.dirname(require.main.filename || process.mainModule.filename), config.public_base_url);

// Cover Files Test Patterns.
const PATTERN_FILES = config.covers.pattern.files;
const PATTERN_NO_JPG_FILES = config.covers.pattern.no_jpg_files;
const PATTERN_FOLDERS = config.covers.pattern.folders;

// exports.createCoverFromTrack = function (req, res, next) {
//
//     const NOT_SECURE_STRING_PATH = req.query.q;
//     const path = DRIVE + ps.cleanPath(NOT_SECURE_STRING_PATH);
//
//     createCoverFile(path, (err, done) => {
//
//         if (err) return errorHandler.errorMessageHandler(err, req, res, next);
//
//         // If cover.jpg created or exit, ok.
//         if (done) {
//             return res.json({
//                 success: true,
//                 msg: 'cover.jpg OK',
//             });
//         }
//
//         // If cover.jpg can't be create.
//         res.json({
//             success: false,
//             msg: 'no cover.jpg',
//         });
//     });
//
// };
//
// exports.createCoversFromAlbum = function (req, res, next) {
//
//     const NOT_SECURE_STRING_SEARCH = req.query.q;
//     const terms = ps.clean(NOT_SECURE_STRING_SEARCH);
//
//     runAlbumCoverCreate(terms, (err, msg) => {
//
//         // Send error.
//         if(err) return errorHandler.errorMessageHandler(err, req, res, next);
//
//         // Send response with message.
//         res.json({
//             success: true,
//             msg: msg,
//         });
//     });
// };
//
// exports.createCoversFromArtist = function (req, res, next) {
//
//     const terms = ps.clean(req.query.q);
//     const params = queryFactory('album', ['artist'], terms);
//
//     // Elasticsearch albums.
//     es.search( params, (err, data) => {
//         if(err) return errorHandler.errorMessageHandler(err, req, res, next);
//
//         // Get tracks path.
//         const albums = data.hits.hits.map((item) => item._source.name);
//
//         //res.json({array:albums, doc:data.hits.hits});
//
//         async.map( albums, runAlbumCoverCreate, (err, data) => {
//                 res.json({
//                     success: true,
//                     msg: data,
//                 });
//             }
//         );
//     });
// };
exports.createAllCovers = function (req, res, next) {

    // Create taskRunner instance.
    const runTask = taskRunner.create(req, res, next);

    // Start Task.
    runTask(
        {
            name:'create all cover',
            unique: true
        },
        runCreateAllCovers
    );
};


function runCreateAllCovers(onError, onStep, onDone) {

    const params = queryFactory('album', null, '');

    // Elasticsearch albums.
    es.search( params, (err, data) => {
        if(err) return onError(err);

        // Get tracks path.
        const albums = data.hits.hits.map((item) => {return {name: item._source.name, cover:item._source.cover}});

        // Declare chunk outside off closure for memory consideration.
        let chunk = [];
        let info = [];

        // Declare function inside controller closure to avoid pass big array args, and save memory.
        function proceedOnChunk() {
            // Get chunk.
            chunk = splitTab(albums, config.index.sizeChunKCover);

            // Async handle chunk.
            async.map( chunk, runAlbumCoverCreate, (err, data) => {
                // Save chunk proceeding info.
                info = info.concat(data);
                // Log chunk process info.
                console.log('Rest ' + albums.length + ' albums to proceed.');
                console.log('--------------------------');
                // If other chunk to handle, do this.
                if(albums.length) return proceedOnChunk();
                // If no more chunk, send res with handling info.
                onDone({
                    success: true,
                    msg: info,
                })}
            );
        }
        // Start process.
        proceedOnChunk();
    });
}

function runAlbumCoverCreate(album, callback){

    const params = queryFactory('tracks', ['meta.album'], album.name, true);

    // Elasticsearch album tracks.
    es.search( params, (err, data) => {

        // test if error in elastic query.
        if(err) {
          return callback(null, `error on album tracks search - value: ${album.name}`);
        }

        // Test if result.
        if(data.hits.total === 0) {
            return callback(null, `Album not found. Try with the exact name.`);
        }

        // Get tracks path.
        const tracks = data.hits.hits.map((item) => item._source.path);

        // Run Algorythm that search and create cover.jpg
        runTracksAlbumCoverCreate(tracks, callback, album);
    });

}

function runTracksAlbumCoverCreate(tracks, callback, context){

    const visitedPath = {};
    const coverPath = context.cover;

    // Try to get cover.jpg from each path.
    // First match and create stop loop and send resp server.
    async.eachSeries( tracks, iterate, (flag) => {

        // Flag up, cover generation ok !
        if( flag === true ) {
            return callback(null, 'cover.jpg created.');
        }
        // If an err is sent, follow up.
        // if( flag instanceof Error ) {
        //     return callback(flag);
        // }
        // No flag up because of cover generation failed for all tracks.
        callback(null, context.name + ' - cannot find, create or extract cover.jpg file.');
    });

    // Wrap iterate arg to stop eachSeries loop at first match.
    function iterate(path, callback){
        createCoverFile(path, coverPath, visitedPath, (err, done) => {
            // If cover.jpg created or exist, or loop ended, done. Stop loop.
            if(done) return callback(done);
            // If error, stop loop and pass error on callback.
            if(err) return callback(err);
            // Else, continue loop
            callback();
        });
    }
}

/**
 * Test access on each files inside path folder.
 * First file accessed stop process an call callback with file path arg.
 *
 * @param path String
 * @param files Array
 * @param callback Function
 */
function testFiles(path, files, callback) {

    // Function that test if file exist.
    function iteration( file, callback ){
        const fpath = path + file;
        fs.access(fpath, (err) => {
            // If file exist, call inner callback with first arg.
            // In async.each context, that stop iteration on files and start each callback function with first arg.
            if(!err) return callback(fpath);
            // If file don't exist, continue loop.
            callback();
        });
    }

    // Start each loop.
    // If file on array files exist on folder path, the file na
    async.each( files, iteration, (filePath) => callback(filePath));
}

function createCoverFile(src, coverPath, visitedPath, callback) {

    // Get album folder path.
    const dirname = path.dirname(src);
    const folder = DRIVE + '/' + dirname + '/';
    const destination = PUBLIC_FILE + '/' + coverPath + '/';
    const cover = destination + 'cover.jpg';

    let mustTestCoverFiles = false;

    if( !visitedPath[dirname] ) {
        visitedPath[dirname] = true;
        mustTestCoverFiles = true;
    }

    // Wrap fs.copy callback to match with pattern callback(err, done);
    function callbackFs(err){
        if (err) {
            // console.error(`TRACK TEST FAIL - error on fs.copy cover.jpg`);
            return callback(null, false);
        }
        // console.log(`TRACK TEST OK - rename jpg file on cover.jpg`);
        callback(null, true);
    }

    // Build index creation sequence.
    let func = !mustTestCoverFiles ? [] : [
        // Test if cover already exist.
        function(next){
            fs.access(cover, (e) => {
                let action = () => callback( null, true);
                if(e) next( null );                     // Call next step.
                else next( action );                    // Stop process and call action.
            });
        },
        // Test if source folder exist.
        function(next){
            fs.access(folder, (e) => {
                let action = () => callback(null, false);
                if(e) next( action );                   // Stop process and call action.
                else next( null );                      // Call next step.
            });
        },
        // Create destination folder.
        function(next){
            fs.mkdirs(destination, (e) => {
                let action = callback.bind(null, null, false);
                if(e) next( action );                   // Stop process and call action.
                else next( null );                      // Call next step.
            });
        },
        // Test if covers files pattern match, and copy to destination if true.
        function(next){
            testFiles(folder, PATTERN_FILES, file => {
                let action = () => fs.copy(file, cover, callbackFs);
                if(file) next( action );                // Stop process and call action.
                else next( null );                      // Call next step.
            });
        },
        // Test if covers no jpg files pattern match, convert and and copy to destination if true.
        function(next){
            testFiles(folder, PATTERN_NO_JPG_FILES, file => {
                let action = () => saveToJpeg(file, cover, callback);
                if(file) next( action );                // Stop process and call action.
                else next( null );                      // Call next step.
            });
        },
        // Test if there are sub-folders that can contain covers files.
        function(next){
            testFiles(folder, PATTERN_FOLDERS, subFolder => {
                let action = () => readPictAndSave(src, cover, callback);
                if(subFolder) next( null, subFolder );  // Call next step with arg.
                else next( action );                    // Stop process and call action.
            });
        },
        // Test if covers files pattern match, and copy to destination if true.
        function(subFolder, next){
            testFiles(subFolder, PATTERN_FILES, file => {
                let action = () => fs.copy(file, cover, callbackFs);
                if(file) next( action );                // Stop process and call action.
                else next( null, subFolder );           // Call next step with arg.
            });
        },
        // Test if covers no jpg files pattern match, convert and and copy to destination if true.
        function(subFolder, next){
            testFiles(subFolder, PATTERN_NO_JPG_FILES, file => {
                let action = () => saveToJpeg(file, cover, callback);
                if(file) next( action );                // Stop process and call action.
                else next( null );                      // Call next step.
            });
        },
    ];

    // Start recovery process.
    async.waterfall(func,
        action => {
            if(action) return action();
            readPictAndSave(src, cover, callback);
        }
     );


    // // Test if cover.jps file exist in folder.
    // fs.access(cover, (err) => {
    //
    //     // If no cover.jpg file.
    //     if (err) {
    //
    //         // Test if source folder exist...
    //         fs.access( folder, (err) => {
    //
    //             // If source folder no exist, stop current process.
    //             if (err) {
    //                 // console.warn(`TRACK TEST FAIL - no exist folder ${folder}`);
    //                 return callback(null, false);
    //             }
    //
    //             // Create public destination folders.
    //             fs.mkdirs(destination, err => {
    //
    //                 // If can't create folder, abord.
    //                 if (err) return callback(null, false);
    //
    //                 // @TODO ajouter les noms avec majuscule ?
    //                 // Other files to test pattern.
    //                 const files = [
    //                     'cover.jpg', 'covers.jpg', 'front.jpg', 'frontal.jpg', 'folder.jpg', 'frontcover.jpg'
    //                 ];
    //
    //                 // Start testing file pattern.
    //                 testFiles(folder, files, (file) => {
    //
    //                     // If matching pattern file found, rename cover.jpg on folder.
    //                     if (file) return fs.copy(file, cover, callbackFs);
    //
    //                     // If no files in first level, test if folders exists.
    //                     else {
    //
    //                         const wrongfiles = [
    //                             'cover.png', 'covers.png', 'front.png', 'frontal.png', 'folder.png',
    //                             'cover.gif', 'covers.gif', 'front.gif', 'frontal.gif', 'folder.gif',
    //                             'cover.bmp', 'covers.bmp', 'front.bmp', 'frontal.bmp', 'folder.bmp',
    //                             'cover.jpeg', 'covers.jpeg', 'front.jpeg', 'frontal.jpeg', 'folder.jpeg',
    //                         ];
    //
    //                         // Start testing other file format.
    //                         testFiles(folder, wrongfiles, (file) => {
    //
    //                             // If matching pattern file found, convert cover file in jpg.
    //                             if (file) return saveToJpeg(file, cover, callback);
    //
    //                             else {
    //                                 // @TODO ajouter les noms avec majuscule ?
    //                                 // First define folder name pattern.
    //                                 const folders = ['cover', 'covers', 'artwork'];
    //
    //                                 // Start testing child folder.
    //                                 testFiles(folder, folders, (file) => {
    //
    //                                     // If matching pattern folder, test files inside the folder.
    //                                     if (file) {
    //
    //                                         // Start testing file pattern inside child folder.
    //                                         testFiles(folder, files, (file) => {
    //
    //                                             // If matching pattern file found, rename cover.jpg on folder.
    //                                             if (file) return fs.copy(file, cover, callbackFs);
    //
    //                                             // If no file match, it's time to try to extract jpg from track binaries.
    //                                             else return readPictAndSave(src, cover, callback);
    //                                         });
    //                                     } else {
    //                                         // If no child folder match, it's time to try to extract jpg from track binaries.
    //                                         return readPictAndSave(src, cover, callback);
    //                                     }
    //                                 });
    //                             }
    //                         })
    //                     }
    //                 });
    //             });
    //         });
    //     }
    //     // If cover.jpg file, do something.
    //     else {
    //         // console.log(`TRACK TEST OK - cover.jpg already exist in ${destination}`);
    //         callback(null, true);
    //     }
    // });
}

/**
 * Return object formatted for elasticsearch params query.
 * @param index
 * @param fields
 * @param terms
 * @returns {{index: *, type: *, body: {size: number, from: number, query: {query_string: {query: string, fields: *, default_operator: string}}}}}
 */
function queryFactory(index, fields, terms, exact) {

    let base_query = {};

    if(terms) {
        terms = exact ? `"${terms}"` : terms + '*';
        base_query.query_string = {
            query: `${terms}`,
            fields: fields,
            default_operator: 'AND'
        };
    }
    else {
        base_query = {
            'match_all': {}
        };
    }

    return {
        index: index,
        type: index,
        size: 10000,
        body: {
            query: base_query,
        }
    };
}
