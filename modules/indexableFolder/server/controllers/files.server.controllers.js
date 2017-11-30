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

    createCoverFile(path, (err, response) => {

        if (err) return errorHandler.errorMessageHandler(err, req, res, next);

        res.json({
            success: true,
            msg: response,
        });
    });

};

exports.createCoversFromAlbum = function (req, res, next) {

    const NOT_SECURE_STRING_SEARCH = req.query.q;

    const index = 'tracks';
    const terms = ps.clean(NOT_SECURE_STRING_SEARCH);
    const fields = ['meta.album', 'meta.ALBUM'];

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

    es.search( params, (err, data) => {
        if(err) return errorHandler.errorMessageHandler(err, req, res, next);

        const tracks = data.hits.hits.map((item) => item._source);

        async.eachSeries( tracks, createCoverFile, (err, response) => {
            res.json({
                success: true,
                msg: response,
            });
        });
    });

    // createCoverFile(path, (err, response) => {
    //
    //     if (err) return errorHandler.errorMessageHandler(err, req, res, next);
    //
    //     res.json({
    //         success: true,
    //         msg: response,
    //     });
    // });
};

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
        fs.access(path + file, (err) => {
            // If file exist, call inner callback with first arg.
            // In async.each context, that stop iteration on files and start each callback function with first arg.
            if(!err) callback(path + file);
            else callback();
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

    // Test if cover.jps file exist in folder.
    fs.access( cover, (err) => {

        // If no cover.jpg file.
        if(err) {

            // Other files to test pattern.
            const files = ['Cover.jpg', 'front.jpg', 'Front.jpg', 'frontal.jpg', 'Frontal.jpg'];

            // Start testing file pattern.
            testFiles(folder, files, (file) => {

                // If matching pattern file found, rename cover.jpg on folder.
                if(file) return fs.rename(file, cover, callback);

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
                                if (file) return fs.rename(file, cover, callback);

                                // If no file match, it's time to try to extract jpg from track binaries.
                                return getCoverFromMeta(src, cover, callback);
                            });
                        }
                        // If no child folder match, it's time to try to extract jpg from track binaries.
                        return getCoverFromMeta(src, cover, callback);
                    });
                }
            });
        }
        // If cover.jpg file, do something.
        else {
            callback(null, `OK. cover.jpg already exist in ${folder}`);
        }
    });
}

function getCoverFromMeta(src, dest, callback) {

    const args = getImgArgs(src, dest);
    const proc = spawnRead(args);

    proc.on("error", callback);
    proc.on("close", (code) => {
        if (code === 0) {
            callback(null, `OK. extracted cover.jpg from ${src}`);
        }
        else {
            callback(null, `NO. ffmpeg can't extract jpg from ${src}. Exit with code ${code}`);
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





/**
 * CALLBACK HELL !!!!!!!!!!!!!!!!!!!!
 *
 * @param src
 * @param callback
 */

function createCover(src, callback) {

    // Get album folder path.
    const folder = ps.removeLast(src);

    fs.access( folder + 'cover.jpg', (err) => {

        // If no cover.jpg file.
        if(err) {

            fs.access( folder + 'Cover.jpg', (err) => {

                // If no Cover.jpg file
                if(err) {

                    fs.access( folder + 'front.jpg', (err) => {

                        // If no front.jpg file.
                        if(err) {

                            fs.access( folder + 'Front.jpg', (err) => {
                                // If no Front.jpg file.
                                if(err) {

                                }
                                // If Front.jpg file.
                                return callback(null, 'success');
                            });
                        }
                        // If front.jpg file.
                        return callback(null, 'success');
                    });
                }
                // If Cover.jpg file.
                return callback(null, 'success');
            });
        }
        // If cover.jpg file.
        return callback(null, 'success');
    });
}