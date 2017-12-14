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

/**
 * Create Node collection reflection deep folder structure from root folder.
 *
 * @param req
 * @param res
 * @param next
 */
exports.index = function (req, res, next) {

    // Delete all Nodes in Nodes collection.
    Node.collection.drop((err) => {

        // If error on drop, exit and log it.
        if(err) return errorHandler.errorMessageHandler(err, req, res, next);

        // Start deep async indexing on root file.
        console.log('Successful drop Node collection.');

        walkAsyncWrap(function done(err) {
            if(err){
                res.status(404);
                return errorHandler.errorMessageHandler(err, req, res, next, 'File not found.');
            }
            res.json({
                success: true,
                msg: 'Finish indexation.',
            });
        });
    });
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
                { $pull: { children : node._id } },
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
                { $push: { children : node._id } },
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
            { $pull: { children : node._id } },
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

    res.json({
        success: true,
        msg: node.children,
    });
};

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
        .populate('children')
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

const walk = function( id, done ) {

    let files = [];


    if ( !id._id ) {
        Node.findById(id).exec(nodeSearch);
    }
    else {
        nodeSearch(null, id);
    }

    function nodeSearch(err, node) {

        if(err) return done(err);

        if (!node.isFile) {
            async.map(
                node.children,
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
        }

        else {
            files.push(node);
            done(null, files);
        }
    }
};

/**
 * Recursive search of all files inside an item.
 * Item can be a file or a folder.
 * All files/folders are saved in db as Node document.
 */
const walkAsyncWrap = function (doneWrap) {

  const regexFile = config.fileSystem.fileAudioTypes;
  const regexSecure = config.security.secureFile;
  const mongoose = require('mongoose');


  console.log('Starting indexation');

  // Call it the first time
  walkAsync(null, null, null, null,
    (err) => {
      if (err) {
        console.error('Indexation Problem');
        return doneWrap(err);
      }
      console.log('Indexation finished');
      doneWrap();
    }
  );

  /**
  * @param path String - item path.
  * @param name String - item name
  * @param id  - mongoose Id
  * @param parentId - item's parent Node id.
  * @param done Function - func called after first search iteration.
  * @returns {*}
  */
  function walkAsync(path, name, id, parentId, done) {

    let uri;
    let childIdArr = [];

    // If root dir
    if (!path) {
      path = '';
      id = mongoose.Types.ObjectId();
      name = 'root';
      parentId = mongoose.Types.ObjectId();
    }
    uri = config.folder_base_url + path;

    // Read old item in dir
    fs.readdir(uri, (err, items) => {
      if (err) return done(err);

      // If item is file save it.
      // If item is dir walk inside.
      async.forEachOf(
        items,
        (item, key, next) => {

          let itemUri = uri + '/' + item;
          let itemPath = path + '/' + item;
          // Check file or dir.
          fs.stat(itemUri,
            (err, itemStats) => {

              // On error next file
              if (err) {
                console.error(err);
                return next();
              }

              // isFile
              // check it & save it.
              if (itemStats.isFile()) {

                // Test if authorized file.
                if (!(regexSecure.test(item) && regexFile.test(item))) {
                  return next();
                }

                // Create File Node
                let fileNode = new Node({
                  _id: mongoose.Types.ObjectId(),
                  name: item,
                  publicName: item.replace(regexFile, ''),
                  path: itemPath,
                  uri: itemUri,
                  parent: parentId,
                  isFile: true,
                });

                // Save File Node
                fileNode.save((err) => {
                  if (!err) {
                    childIdArr.push(fileNode.id);
                    return next();
                  }
                  console.error(err);
                  next();
                });

                // isDir
                // check it & save it.
              } else if (itemStats.isDirectory()) {

                let dirId = mongoose.Types.ObjectId();
                childIdArr.push(dirId);

                walkAsync(itemPath, item,  dirId, parentId, (err) => {
                  if (!err) {
                    console.log('Succefully index directory : ' + itemPath);
                    return next();
                  }
                  console.error(err);
                  next();
                } );


                // Nor file nor dir next
              } else {
                return next();
              }

            }
          )


        },
        (e) => {

          // Create Parent Node & save it
          let parentNode = new Node({
            _id: id,
            name: name,
            path: path,
            uri: uri,
            parent: parentId,
            isFile: false,
            children: childIdArr
          });

          parentNode.save((err) => {
            if (e) return done(e);
            if (err) return done(err);
          });


          if (err) return done(err);

          done();
        }
      )

    });

  }


};