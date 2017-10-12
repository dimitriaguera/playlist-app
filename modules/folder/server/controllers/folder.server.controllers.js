/**
 * Created by Dimitri Aguera on 30/09/2017.
 */
const fs = require('fs');
const async = require('async');
const path = require('path');
const config = require(path.resolve('./config/env/config.server'));

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

function getStats() {

}