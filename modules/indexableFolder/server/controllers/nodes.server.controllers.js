/**
 * Created by Dimitri Aguera on 30/09/2017.
 */
const fs = require('fs');
const async = require('async');
const path = require('path');
const ps = require(path.resolve('./modules/core/client/services/core.path.services'));
const config = require(path.resolve('./config/env/config.server'));
const errorHandler = require(path.resolve('./modules/core/server/services/error.server.services'));
const taskRunner = require(path.resolve('./modules/task/server/services/task.server.services'));
const {clock} = require(path.resolve('./modules/core/server/services/time.server.services.js'));

const {splitTab, mergeUniqArray, difference, deepObjDifference, cloneDeep} = require(path.resolve('./modules/core/server/services/obj.server.services'));

const Node = require(path.resolve('./modules/indexableFolder/server/models/indexableFolder.server.models'));
const mongoose = require('mongoose');

const metaTag = require(path.resolve('./modules/music/server/services/metaTag.server.services'));


const socketsEvents = require(path.resolve('./config/sockets/sockets.conf'));

const {runElasticUpdates} = require(path.resolve('./modules/indexableFolder/server/controllers/elastic.server.controllers'));

const {promisify} = require('util');

// const runElasticUpdates = function( a , cb){
//   cb();
// };

// @todo put this when export conf
const rootOK = ps.removeLastSeparator(ps.conformPathToOs(config.folder_base_url));

exports.index = function (req, res, next) {
  // Create taskRunner instance.
  const runTask = taskRunner.create(req, res, next);

  // Start Task.
  runTask(
    {
      name: 'index nodes',
      unique: true
    },
    runIndexNodes
  );
};

// function runTest(onError, onStep, onDone){
//
//     let interval;
//     let count = 0;
//
//     interval = setInterval(() => {
//         try {
//             count ++;
//             console.log(count);
//             onStep(`Step num ${count}`);
//         } catch(e) {
//             clearInterval(interval);
//             return onError(e);
//         }
//     }, 1000);
//
//     setTimeout(() => {
//         try {
//             clearInterval(interval);
//             onDone('Cool ca a marché');
//         } catch(e) {
//             clearInterval(interval);
//             return onError(e);
//         }
//     }, 20000);
// }


// Save many mongo docs in db
exports.saveInDb = function (nodes, cb) {
  Node.insertMany(nodes, (err, docs) => {
    if (err) return cb(err);
    cb(null, docs);
  });
};


/**
 * Create Node collection reflection deep folder structure from root folder.
 *
 */
function runIndexNodes (onError, onStep, onDone) {
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
          let itemUri = path.join(uri, item);

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
  function findMetaAndSave (files, cbfindMetaAndSave) {
    // @todo let it here ? Closure memory problem vs cpu
    let tabOnWork;

    // Save dir in DB
    function saveDirInDb (dirs, cb) {
      const dirsToSave = [];
      async.forEachOfSeries(
        dirs,
        (dir, key, nextDir) => {
          const dirInfo = path.parse(key);
          const pathDir = ps.toPosixPath(path.relative(rootOK, key));
          dirsToSave.push({
            _id: dir,
            name: (pathDir) ? dirInfo.base : 'root',
            path: pathDir,
            uri: key,
            parent: dirs[dirInfo.dir],
            isFile: false
          });
          nextDir();
        },
        (err) => {
          if (err) return cb(err);
          exports.saveInDb(dirsToSave, (err) => {
            if (err) return cb(err);
            cb();
          })
        }
      );
    }

    // Read all files in files var and find
    // Meta. When its finised call saveDirInDb for saving
    // Dir
    function bulkTraitement () {
      tabOnWork = splitTab(files, config.index.sizeChunkNode);

      async.map(
        tabOnWork,
        (filePath, nextFile) => {
          metaTag.read(filePath, (err, data) => {
            if (err) {
              console.log('Error when reading meta for : ' + filePath);
            }

            let file = path.parse(filePath);
            nextFile(null, {
              name: file.base,
              publicName: file.name,
              path: ps.toPosixPath(path.relative(rootOK, filePath)),
              uri: filePath,
              parent: dirs[file.dir],
              isFile: true,
              meta: data || metaTag.metaSchema()
            });
          });
        },

        (err, res) => {
          if (err) return cbfindMetaAndSave(err);

          console.log('End read bulk metaTag');

          exports.saveInDb(res,
            (err) => {
              if (err) return cbfindMetaAndSave(err);

              console.log('End of writing bulk in Db');
              console.log('Remaining files : ' + files.length);
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
  function sendResult (err) {
    if (err) return onError(err);
    let end = clock(start);
    console.log('***********************');
    console.log('Indexation is Finished at : ' + end.end);
    console.log('It takes (s) : ' + end.duration);
    console.log('Nb file : ' + nbFiles);
    console.log('Nb dir : ' + nbDirs);
    console.log('***********************');

    onDone({
      nbFiles: nbFiles,
      nbDir: nbDirs,
      duration: end.end
    });
  }


  /**
   * Start the indexation process
   */
  (function init () {
    start = clock();
    console.log('***********************');
    console.log('Indexation started at : ' + start);

    // Remove all collection nodes
    Node.collection.drop(
      (err) => {
        // @todo when collection doesn't exist it an error but i do nothing
        // if (err) return err;

        console.log('Node collection drop');

        // Read root dir and save nodes
        read(rootOK, (err) => {
          // @todo check this err
          if (err) return err;
          nbFiles = files.length;
          nbDirs = Object.keys(dirs).length;
          findMetaAndSave(files, sendResult);
        });
      }
    );
  })();
}

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

  // Object.assign(node, req.body.node);

  node.save((err) => {
    if (err) {
      res.status(404);
      return errorHandler.errorMessageHandler(err, req, res, next);
    }

    // If node move, update parents.
    if (newParentId && parentId !== newParentId) {
      // Update old parent.
      Node.update(
        {_id: parentId},
        {safe: true},
        (err) => {
          // If error on update, stop process.
          if (err) return errorHandler.errorMessageHandler(err, req, res, next);

          // If update success, response with success.
          res.json({
            success: true,
            msg: `Updated old parent Node ${parentId.name}`
          });
        });

      // Update old parent.
      Node.update(
        {_id: newParentId},
        {safe: true},
        (err) => {
          // If error on update, stop process.
          if (err) return errorHandler.errorMessageHandler(err, req, res, next);

          // If update success, response with success.
          res.json({
            success: true,
            msg: `Updated current parent Node ${newParentId.name}`
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
    if (err) return errorHandler.errorMessageHandler(err, req, res, next);

    // If node removed, update parent Node.
    Node.update(
      {_id: node.parent},
      {safe: true},
      (err) => {
        // If error on update, stop process.
        if (err) return errorHandler.errorMessageHandler(err, req, res, next);

        console.log(`Parent node updated`);

        // If update success, response with success.
        res.json({
          success: true,
          msg: `Removed index ${data.name}`
        });
      });
  });
};

const checkStringReturnArray = function (str) {
  if (typeof str === 'string' || str instanceof String) {
    if (str.length) return str.split(/\s*[,;\/]\s*/);
    return [];
  } else if (!str) {
    return [];
  }
  return str;
};

// @todo add check to prevent injection
const cleanMeta = function (meta) {
  /// /// Definition
  function removeInvalidMeta (meta) {
    let metaSchema = metaTag.metaSchema();

    return Object
      .keys(meta)
      .filter(key => metaSchema[key] !== undefined)
      .reduce((acc, key) => (acc[key] = meta[key], acc), {});
  }

  /// ///////

  let cleanMeta = removeInvalidMeta(meta);
  if (cleanMeta.genre) cleanMeta.genre = checkStringReturnArray(cleanMeta.genre);


  return cleanMeta;
};


/**
 * Add update meta of a Node to the taskManager
 *
 * @param req
 * @param res
 * @param next
 */
exports.updateMeta = function (req, res, next) {
  // Create taskRunner instance.
  const runTask = taskRunner.create(req, res, next);

  // Start Task.
  runTask(
    {
      name: 'update meta',
      unique: false
    },
    (onError, onStep, onDone) => updateMetaWrap(onError, onStep, onDone, req)
  );
};


/**
 * Update a Node, and if needed, his parent.
 *
 * @param onError
 * @param onStep
 * @param onDone
 * @param req
 * @param opts
 */

async function updateMetaWrap (onError, onStep, onDone, req, opts) {
  /// ///////////////////////////////////// Declaration

  opts = Object.assign(
    {},
    {
      updateDB: true,
      updateES: true,
      updateFiles: false
    },
    req.body.opts,
    opts
  );

  let msg = {error: '', msg: ''};

  const walkP = promisify(walk);
  const runElasticUpdatesP = promisify(runElasticUpdates);

  // Update Meta Node in memory
  function updateInMemMeta (oldNodes, reqMeta, metaAction) {
    let newNodes = cloneDeep(oldNodes);

    // Loop on every node & change theirs meta
    let tmp1, tmp2;
    for (let i = 0, l = newNodes.length; i < l; i++) {
      Object.keys(reqMeta).forEach((key) => {
        // Flag Override
        if (metaAction[key] === 'override') {
          newNodes[i].meta[key] = reqMeta[key];

          // Flag Remove
        } else if (metaAction[key] === 'remove') {
          tmp1 = checkStringReturnArray(reqMeta[key]);
          tmp2 = checkStringReturnArray(newNodes[i].meta[key]);

          // Add element only if doesn't exists.
          if (key === 'genre') {
            newNodes[i].meta[key] = difference(tmp2, tmp1);
          } else {
            newNodes[i].meta[key] = difference(tmp2, tmp1).join(', ');
          }

          // Flag Add
        } else if (metaAction[key] === 'add') {
          tmp1 = checkStringReturnArray(reqMeta[key]);
          tmp2 = checkStringReturnArray(newNodes[i].meta[key]);

          // Add element only if doesn't exists.
          if (key === 'genre') {
            newNodes[i].meta[key] = mergeUniqArray(tmp1, tmp2);
          } else {
            newNodes[i].meta[key] = mergeUniqArray(tmp1, tmp2).join(', ');
          }
        }
      });
    }

    return newNodes;
  }

  // Update node in db
  async function updateInDbMeta (nodes) {
    // Initialise the bulk operations array
    const bulkOps = nodes.map((node) => {
      return {
        'updateOne': {
          'filter': {'_id': node._id},
          'update': {'$set': {'meta': node.meta}}
        }
      }
    });

    // Change Meta in Db (NB bulkWrite Return Promise
    return Node.bulkWrite(bulkOps, {'ordered': true, w: 1});
  }

  // Update meta data in file
  async function updateMetaInFile (nodes) {
    let filesErr = [];

    // Is working because this part is sync
    for (let i = 0, l = nodes.length; i < l; i++) {
      metaTag.saveMeta(
        nodes[i].uri,
        nodes[i].meta,
        (err) => {
          if (err) filesErr.push(nodes[i].uri);
        }
      );
    }

    return {nodes: nodes, filesErr: filesErr}
  }


  async function initAndCheck (req) {
    if (!req.fileNode && req.fileNode.collection.name !== 'nodes') throw new Error('Can\'t find node.');

    if (!req.body.meta) throw new Error('No meta in request.');

    if (!req.body.metaAction) throw new Error('No action meta in request.');

    // Check if action is need
    let somethingToDo = false;
    Object.keys(req.body.metaAction).forEach((key) => {
      if (req.body.metaAction[key] !== 'donothing') somethingToDo = true;
    });

    // If no action return
    if (!somethingToDo) throw new Error('All action are donothing.');

    // Check if valid meta
    let reqMetaClean = cleanMeta(req.body.meta);
    if (!Object.keys(reqMetaClean).length) throw new Error('No valid Meta.');

    let nodes;
    if (req.fileNode.isFile) {
      nodes = [req.fileNode];
    } else {
      // Load All children audio file ( recursively )
      nodes = await walkP(req.fileNode);
    }

    return {
      oldNodes: nodes,
      reqMeta: reqMetaClean, // New meta from the request
      metaAction: req.body.metaAction // Action to do in each meta field
    }
  }

  function checkDiffOldAndNewNodes (oldNodes, newNodes) {
    let change;

    for (let i = 0, l = oldNodes.length; i < l; i++) {
      change = deepObjDifference(newNodes[i], oldNodes[i]);
      if (Object.keys(change).length === 0) newNodes.splice(i, 1);
    }
  }

  /// ///////////////////////////////////// END Declaration


  try {
    let {oldNodes, reqMeta, metaAction} = await initAndCheck(req);

    // Update nodes meta in memory
    let newNodes = updateInMemMeta(oldNodes, reqMeta, metaAction);

    // Check if diff between old and new meta;
    checkDiffOldAndNewNodes(oldNodes, newNodes);

    // If no newNode stop the process.
    if (!newNodes.length) throw new Error('No node need to be update.');

    // Update nodes meta in DB
    if (opts.updateDB) {
      console.log('Start Update DB for meta');
      await updateInDbMeta(newNodes);
      console.log('End Update DB for meta');
      // Put message in taskmanager
      msg.msg = `Succefully update ${Object.keys(newNodes).length}.`;
      onStep(msg);
    }

    // @todo improve promisify to access log option of runElasticUpdatesP
    if (opts.updateES) {
      console.log('Start Update ES for meta');
      msg.elastic_update_log = await runElasticUpdatesP(newNodes);
      console.log('End Update ES for meta');
      // Put message in taskmanager
      msg.msg = `Succefully update Elastic ${Object.keys(newNodes).length}.`;
      onStep(msg);
    }

    // Update meta in files
    if (opts.updateFiles) {
      console.log('Start Update Files for meta');
      let {filesErr} = await updateMetaInFile(newNodes);
      console.log('END Update Files for meta');
      // Put message in taskmanager
      if (filesErr.length > 0) {
        msg.msg = `Some error append when writing meta to files.`;
        msg.errorFiles = filesErr;
        msg.errorFilesNb = filesErr.length;
        onStep(msg);
      } else {
        msg.msg = `Succefully write meta tag to all files (${Object.keys(newNodes).length}).`;
        onStep(msg);
      }
    }

    // Emit socket event for the client
    socketsEvents.emit('save:meta', newNodes);

    console.log(msg);
    onDone(JSON.stringify(msg));
  } catch (e) {
    console.log(e);

    // Put message in taskmanager
    msg = {msg: e.msg, error: e};
    onError(JSON.stringify(msg));
  }
}

/**
 * Return file's Node object.
 * @param req
 * @param res
 * @param next
 */
exports.openNode = function (req, res, next) {
  const node = req.fileNode;

  getChildrenNodes(node._id, (err, nodes) => {
    if (err) return errorHandler.errorMessageHandler(err, req, res, next);

    if (!nodes) {
      res.status(404);
      return res.json({
        success: false,
        msg: `File not found.`
      });
    }

    res.json({
      success: true,
      msg: nodes
    });
  });
};

function getChildrenNodes (parentId, callback) {
  Node.find({parent: parentId})
    .lean()
    .exec((err, nodes) => {
      if (err) {
        return callback(err);
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
    if (err) return errorHandler.errorMessageHandler(err, req, res, next);
    res.json({
      success: true,
      count: files.length,
      msg: files
    });
  })
};

exports.getNodeFromPath = function (path, cb) {
  Node
    .findOne({path: `${ps.cleanPath(path)}`})
    .lean()
    .exec((err, node) => {
      if (err) return cb(err);
      cb(null, node);
    })
  ;
};


exports.getNodeFromQuery = function (req, res, next) {
  let NOT_SECURE_STRING = '';
  let queryString = '';
  let query;

  // If query Node file by path.
  // Test on undefined permit query on empty path (root folder)
  if (req.query.path !== undefined) {
    NOT_SECURE_STRING = req.query.path;
    queryString = `${ps.cleanPath(NOT_SECURE_STRING)}`;
    query = Node.findOne({path: queryString});
  }

  // If query Node file by id.
  else if (req.query.id) {
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
      if (err) {
        return next(err);
      }

      // If params not match on Node folder, stop process.
      if (!node) {
        res.status(404);
        return res.json({
          success: false,
          msg: `File not found.`
        });
      }

      req.fileNode = node;
      next();
    });
};

exports.getNodeById = function (req, res, next, id) {
  Node.findById(id).exec(function (err, node) {
    if (err) {
      return next(err);
    }

    // If params not match on Node folder, stop process.
    if (!node) {
      res.status(404);
      return res.json({
        success: false,
        msg: `File not found.`
      });
    }

    req.fileNode = node;
    next();
  });
};

const walk = function (node, done) {
  let files = [];

  nodeSearch(null, node);

  function nodeSearch (err, node) {
    if (err) return done(err);

    if (!node.isFile) {
      getChildrenNodes(node._id, (err, nodes) => {
        if (err) return done(err);

        async.map(
          nodes,
          (id, callback) => {
            walk(id, (err, res) => {
              if (err) return done(err);
              files = files.concat(res);
              callback(null, files);
            });
          },
          (err, result) => {
            if (err) return done(err);
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
