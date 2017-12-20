/**
 * Created by Dimitri Aguera on 30/09/2017.
 */
const fs = require('fs');
const async = require('async');
const path = require('path');
const config = require(path.resolve('./config/env/config.server'));
const errorHandler = require(path.resolve('./modules/core/server/services/error.server.services'));
const {clock} = require(path.resolve('./modules/core/server/services/time.server.services.js'));

const ps = require(path.resolve('./modules/core/client/services/core.path.services'));
const { splitTab } = require(path.resolve('./modules/core/server/services/obj.server.services'));

const Node = require(path.resolve('./modules/indexableFolder/server/models/indexableFolder.server.models'));
const mongoose = require('mongoose');

const metaTag = require(path.resolve('./modules/music/server/services/metaTag.server.services'));



// @todo put this when export conf
const rootOK = ps.conformPathToOs(config.folder_base_url);

/**
 * Create Node collection reflection deep folder structure from root folder.
 *
 * @param req
 * @param res
 * @param next
 */
exports.index = function (req, res, next) {

  const regexFile = config.fileSystem.fileAudioTypes;
  const regexSecure = config.security.secureFile;

  let start;
  let files = [];
  let nbFiles = 0;
  let nbDirs = 0;
  let dirs = {};

  // Read all items recursively in dir an fill files and dirs var
  function read (uri, done) {

    // Generate Mongod id for dir
    dirs[uri] = mongoose.Types.ObjectId();

    fs.readdir(uri, (err, items) => {
      if (err) return done(err);

      // If item is file save it.
      // If item is dir walk inside.
      async.forEachOf(
        items,
        (item, key, next) => {

          let itemUri = path.join(uri,item);

          // Check file or dir.
          fs.stat(itemUri,
            (err, itemStats) => {

              if (err) {
                console.error(err);
                return next();
              }

              if (itemStats.isFile()) {
                // Test type of file
                // Test if authorized file.
                if (!(regexSecure.test(item) && regexFile.test(item))) {
                  return next();
                }

                files.push(itemUri);
                return next();

              } else if (itemStats.isDirectory()) {
                read(itemUri, (err) => {
                  if (err) console.error(err);
                  return next();
                });
              }
            }
          );
        },
        (err) => {
          if (err) done(err);
          done();
        }
      );
    });
  }


  // Find All meta of files and Save it in Mongo
  // Do that by bulk off 10 files
  function findMetaAndSave(files, cbfindMetaAndSave){

    //@todo let it here ? Closure memory problem vs cpu
    let tabOnWork;

    // Save many mongo docs in db
    function saveInDb(files, cb){
      Node.insertMany(files, (err) => {
        if (err) return cb(err);
        cb();
      });
    }

    // Save dir in DB
    function saveDirInDb(dirs, cb){
      const dirsToSave = [];
      async.forEachOfSeries(
        dirs,
        (dir, key, nextDir ) => {
          const dirInfo = path.parse(key);
          const pathDir = ps.toPosixPath(path.relative(rootOK, key));
          dirsToSave.push( {
            _id: dir,
            name: (pathDir) ? dirInfo.base : 'root',
            path: pathDir,
            uri: key,
            parent: dirs[dirInfo.dir],
            isFile: false,
          });
          nextDir();
        },
        (err) => {
          if (err) return cb(err);
          saveInDb(dirsToSave, (err) => {
            if (err) return cb(err);
            cb();
          })
        }
      );
    }

    // Read all files in files var and find
    // Meta. When its finised call saveDirInDb for saving
    // Dir
    function bulkTraitement() {
      tabOnWork = splitTab(files, config.index.sizeChunkNode);

      async.map(
        tabOnWork,
        (filePath, nextFile ) => {
          metaTag.read(filePath, (err, data) => {

            if (err) {
              console.log('Error when reading meta for : ' + filePath);
            }

            let file = path.parse(filePath);
            nextFile( null, {
              name: file.base,
              publicName: file.name,
              path: ps.toPosixPath(path.relative(rootOK, filePath)),
              uri: filePath,
              parent: dirs[file.dir],
              isFile: true,
              meta: data || {}
            });

          });
        },

        (err, res) => {

          if (err) return cbfindMetaAndSave(err);

          console.log('End read bulk metaTag');

          saveInDb(res,
            (err) => {
              if (err) return cbfindMetaAndSave(err);

              console.log('End of writing bulk in Db');
              console.log('Remaining files : ' + files.length );
              console.log('-------------------------------------');
              if (files.length) return bulkTraitement();

              console.log('Starting of writing dir in Db');
              saveDirInDb(dirs, (err) => {
                if (err) return cbfindMetaAndSave(err);
                console.log('End of writing dir in Db');
                cbfindMetaAndSave();
              })
            }
          );
        }
      );
    }

    bulkTraitement();
  }


  /**
   * Fct Send res and log when indexation is finish
   * @param err
   */
  function sendResult(err){

    if (err) return errorHandler.errorMessageHandler(err, req, res, next);
    let end = clock(start);
    console.log('***********************');
    console.log('Indexation is Finished at : ' + end.end);
    console.log('It takes (s) : ' + end.duration);
    console.log('Nb file : ' + nbFiles);
    console.log('Nb dir : ' + nbDirs);
    console.log('***********************');

    res.json({
      success: true,
      msg: {
        nbFiles: nbFiles,
        nbDir: nbDirs,
        duration: end.end,
      },
    });
  }


  /**
   * Start the indexation process
   */
  (function init(){

    start = clock();
    console.log('***********************');
    console.log('Indexation started at : ' + start);

    // Remove all collection nodes
    Node.collection.drop(
      (err) => {
        if (err) return errorHandler.errorMessageHandler(err, req, res, next);

        console.log('Node collection drop');

        // Read root dir and save nodes
        read(rootOK, (err) => {
          if (err) return next(err);
          nbFiles = files.length;
          nbDirs = Object.keys(dirs).length;
          findMetaAndSave( files, sendResult);
        });
      }
    );

  })();

};

/**
 * Update a Node, and if needed, his parent.
 *
 * @param req
 * @param res
 * @param next
 */
exports.update = function (req, res, next) {

    const node = req.fileNode;
    const parentId = node.parent;
    const newParentId = req.body.node.parent;

    Object.assign(node, req.body.node);

    node.save((err) => {

        if(err){
            res.status(404);
            return errorHandler.errorMessageHandler(err, req, res, next);
        }

        // If node move, update parents.
        if( newParentId && parentId !== newParentId) {

            // Update old parent.
            Node.update(
                { _id: parentId },
                { safe: true },
                (err) => {

                    // If error on update, stop process.
                    if ( err ) return errorHandler.errorMessageHandler(err, req, res, next);

                    // If update success, response with success.
                    res.json({
                        success: true,
                        msg: `Updated old parent Node ${parentId.name}`,
                    });
                });

            // Update old parent.
            Node.update(
                { _id: newParentId },
                { safe: true },
                (err) => {

                    // If error on update, stop process.
                    if ( err ) return errorHandler.errorMessageHandler(err, req, res, next);

                    // If update success, response with success.
                    res.json({
                        success: true,
                        msg: `Updated current parent Node ${newParentId.name}`,
                    });
                });
        }
    });
};


/**
 * Delete deeply Node and his children on Nodes collection.
 *
 * @param req
 * @param res
 * @param next
 */
exports.delete = function (req, res, next) {

    const node = req.fileNode;

    // If node found, remove it.
    node.remove((err, data) => {

        // If error on remove node, stop process.
        if ( err ) return errorHandler.errorMessageHandler(err, req, res, next);

        // If node removed, update parent Node.
        Node.update(
            { _id: node.parent },
            { safe: true },
            (err) => {

                // If error on update, stop process.
                if ( err ) return errorHandler.errorMessageHandler(err, req, res, next);

                console.log(`Parent node updated`);

                // If update success, response with success.
                res.json({
                    success: true,
                    msg: `Removed index ${data.name}`,
                });
            });
    });
};

/**
 * Return file's Node object.
 * @param req
 * @param res
 * @param next
 */
exports.openNode = function (req, res, next) {

    const node = req.fileNode;

    getChildrenNodes(node._id, (err, nodes) =>
    {
        if ( err ) return errorHandler.errorMessageHandler(err, req, res, next);

        if ( !nodes ) {
            res.status(404);
            return res.json({
                success: false,
                msg: `File not found.`,
            });
        }

        res.json({
            success: true,
            msg: nodes,
        });
    });
};

function getChildrenNodes(parentId, callback){
    Node.find({parent:parentId})
        .lean()
        .exec((err, nodes) => {

            if ( err ) {
                return callback( err );
            }

            callback(null, nodes);
        });
}

/**
 * Recursive search files through Node and his children.
 * Return list of all files.
 *
 * @param req
 * @param res
 * @param next
 */
exports.getFilesNode = function (req, res, next) {

    const node = req.fileNode;

    walk(node, (err, files) => {
        if( err ) return errorHandler.errorMessageHandler(err, req, res, next);
        res.json({
            success: true,
            count: files.length,
            msg: files,
        });
    })
};

exports.getNodeFromQuery = function(req, res, next) {

    let NOT_SECURE_STRING = '';
    let queryString = '';
    let query;

    // If query Node file by path.
    // Test on undefined permit query on empty path (root folder)
    if(req.query.path !== undefined) {
        NOT_SECURE_STRING = req.query.path;
        queryString = `${ps.cleanPath(NOT_SECURE_STRING)}`;
        query = Node.findOne({ path:queryString });
    }

    // If query Node file by id.
    else if(req.query.id) {
        NOT_SECURE_STRING = req.query.id;
        queryString = ps.clean(NOT_SECURE_STRING);
        query = Node.findById(queryString);
    }

    // If nothing, next middleware.
    else {
        return next();
    }

    // Exec query.
    query
        .lean()
        .exec((err, node) => {

            if ( err ) {
                return next( err );
            }

            // If params not match on Node folder, stop process.
            if ( !node ) {
                res.status(404);
                return res.json({
                    success: false,
                    msg: `File not found.`,
                });
            }

            req.fileNode = node;
            next();
        });
};

exports.getNodeById = function(req, res, next, id) {

    Node.findById(id).exec(function(err, node){

        if ( err ) {
            return next( err );
        }

        // If params not match on Node folder, stop process.
        if ( !node ) {
            res.status(404);
            return res.json({
                success: false,
                msg: `File not found.`,
            });
        }

        req.fileNode = node;
        next();
    });
};

const walk = function( node, done ) {

    let files = [];

    nodeSearch(null, node);

    function nodeSearch(err, node) {
        if(err) return done(err);

        if (!node.isFile) {
            getChildrenNodes(node._id, (err, nodes) => {
                if(err) return done(err);

                async.map(
                    nodes,
                    (id, callback) => {
                        walk(id, (err, res) => {
                            if(err) return done(err);
                            files = files.concat(res);
                            callback(null, files);
                        });
                    },
                    (err, result) => {
                        if(err) return done(err);
                        done(null, files);
                    }
                );
            });
        }

        else {
            files.push(node);
            done(null, files);
        }
    }
};