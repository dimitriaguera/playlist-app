const path = require('path');
const config = require(path.resolve('./config/env/config.server'));
const errorHandler = require(path.resolve('./modules/core/server/services/error.server.services'));
const ps = require(path.resolve('./modules/indexableFolder/server/services/path.server.services'));
const es = require(path.resolve('./modules/indexableFolder/server/elastic/elasticsearch'));
const spawn = require("child_process").spawn;
const async = require('async');
const ffmpeg = spawn.bind(null, process.env.FFMPEG_PATH || "ffmpeg");
const fs = require("fs");

exports.createCoverFromTrack = function (req, res, next) {


    const DRIVE = config.folder_base_url;
    const NOT_SECURE_STRING_PATH = req.query.q;
    const path = DRIVE + ps.cleanPath(NOT_SECURE_STRING_PATH);

    createCoverFile(path, (err, done) => {

        if (err) return errorHandler.errorMessageHandler(err, req, res, next);

        // If cover.jpg created or exit, ok.
        if (done) {
            return res.json({
                success: true,
                msg: 'cover.jpg OK',
            });
        }

        // If cover.jpg can't be create.
        res.json({
            success: false,
            msg: 'no cover.jpg',
        });
    });

};

exports.createCoversFromAlbum = function (req, res, next) {

    const NOT_SECURE_STRING_SEARCH = req.query.q;
    const terms = ps.clean(NOT_SECURE_STRING_SEARCH);

    runAlbumCoverCreate(terms, () => {
        res.json({
            success: true,
            msg: '',
        });
    });
};

exports.createCoversFromArtist = function (req, res, next) {

    const NOT_SECURE_STRING_SEARCH = req.query.q;

    const index = 'album';
    const terms = ps.clean(NOT_SECURE_STRING_SEARCH);
    const fields = ['artist'];

    const base_query = {
        query_string: {
            query: `${terms}*`,
            fields: fields,
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

    // Elasticsearch albums.
    es.search( params, (err, data) => {
        if(err) return errorHandler.errorMessageHandler(err, req, res, next);

        // Get tracks path.
        const albums = data.hits.hits.map((item) => item._source.name);

        //res.json({array:albums, doc:data.hits.hits});

        async.map( albums, runAlbumCoverCreate, (err, data) => {
                res.json({
                    success: true,
                    msg: data,
                });
            }
        );
    });
};

function runAlbumCoverCreate(album, callback){

    const DRIVE = config.folder_base_url;

    const index = 'tracks';
    const fields = ['meta.album', 'meta.ALBUM'];

    const base_query = {
        query_string: {
            query: album,
            fields: fields,
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

    // Elasticsearch album.
    es.search( params, (err, data) => {
        if(err) return callback();

        // Get tracks path.
        const tracks = data.hits.hits.map((item) => DRIVE + item._source.path);

        // Run Algorythm that search and create cover.jpg
        runTracksAlbumCoverCreate(tracks, callback, album);
    });

}

function runTracksAlbumCoverCreate(tracks, callback, context){

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
        callback(null, context + ' - cannot find, create or extract cover.jpg file.');
    });

    // Wrap iterate arg to stop eachSeries loop at first match.
    function iterate(path, callback){
        createCoverFile(path, (err, done) => {
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

function createCoverFile(src, callback) {

    // Get album folder path.
    const folder = ps.removeLast(src);
    const cover = folder + 'cover.jpg';

    // Wrap fs.rename callback to match with pattern callback(err, done);
    function callbackFs(err){
        if (err) {
            console.error(`TRACK TEST FAIL - error on fs.rename cover.jpg`);
            return callback(null, false);
        }
        console.log(`TRACK TEST OK - rename jpg file on cover.jpg`);
        callback(null, true);
    }

    // Test if album folder exist...
    fs.access( folder, (err) => {

        // If parent folder no exist, stop current process.
        if(err){
            console.warn(`TRACK TEST FAIL - no exist folder ${folder}`);
            return callback(null, false);
        }

        // Test if cover.jps file exist in folder.
        fs.access(cover, (err) => {

            // If no cover.jpg file.
            if (err) {

                // Other files to test pattern.
                const files = ['Cover.jpg', 'front.jpg', 'Front.jpg', 'frontal.jpg', 'Frontal.jpg', 'folder.jpg'];

                // Start testing file pattern.
                testFiles(folder, files, (file) => {

                    // If matching pattern file found, rename cover.jpg on folder.
                    if (file) return fs.rename(file, cover, callbackFs);

                    // If no files in first level, test if folders exists.
                    else {
                        // First define folder name pattern.
                        const folders = ['cover', 'Cover', 'covers', 'Covers'];

                        // Start testing child folder.
                        testFiles(folder, folders, (file) => {

                            // If matching pattern folder, test files inside the folder.
                            if (file) {

                                //add cover.jpg to testing pattern.
                                files.unshift('cover.jpg');

                                // Start testing file pattern inside child folder.
                                testFiles(folder, files, (file) => {

                                    // If matching pattern file found, rename cover.jpg on folder.
                                    if (file) return fs.rename(file, cover, callbackFs);

                                    // If no file match, it's time to try to extract jpg from track binaries.
                                    else return getCoverFromMeta(src, cover, callback);
                                });
                            } else {
                                // If no child folder match, it's time to try to extract jpg from track binaries.
                                return getCoverFromMeta(src, cover, callback);
                            }
                        });
                    }
                });
            }
            // If cover.jpg file, do something.
            else {
                console.log(`TRACK TEST OK - cover.jpg already exist in ${folder}`);
                callback(null, true);
            }
        });
    });
}

function getCoverFromMeta(src, dest, callback) {

    const args = getImgArgs(src, dest);
    const proc = spawnRead(args);

    proc.on("error", callback);
    proc.on("close", (code) => {
        if (code === 0) {
            console.log(`TRACK TEST OK - extracted cover.jpg from ${src}`);
            callback(null, true);
        }
        else {
            console.warn(`TRACK TEST FAIL - ffmpeg can't extract jpg from ${src}. Exit with code ${code}`);
            callback(null, false);
        }
    });
}

function spawnRead(args) {
    return ffmpeg(args, { detached: true, encoding: "binary" });
}

function getImgArgs(src, dest) {
    return [
        "-i",
        src,
        dest,
        "-n" // Force no rewrite if file exist.
    ];
}
