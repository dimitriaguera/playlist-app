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

    const DRIVE = config.folder_base_url;
    const path = '';
    const context = {
        firstParent: true,
        indexCount: 0,
        rootPath: DRIVE,
    };

    // Delete all Nodes in Nodes collection.
    Node.collection.drop((err) => {

        // If error on drop, exit and log it.
        if(err) return errorHandler.errorMessageHandler(err, req, res, next);

        // Start deep async indexing on root file.
        console.log(`Successful drop Node collection.`);
        walkAsync( context, path, null, null, null, false, (err) => {
            if(err){
                res.status(404);
                return errorHandler.errorMessageHandler(err, req, res, next, 'File not found.');
            }
            res.json({
                success: true,
                msg: 'Starting indexation.',
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
 *
 * @param context Object - object passed through all async iterations. Must have: {firstParent:true, indexCount:0}
 * @param path String - item path.
 * @param name String - item name
 * @param callback Function - func called when item's Node document is saved. Call with args: callback( err, Node._id )
 * @param parentId _id - item's parent Node id.
 * @param isFile Boolean - false if item is folder, true if item is file.
 * @param done Function - func called after first search iteration.
 * @returns {*}
 */
function walkAsync( context, path, name, callback, parentId, isFile, done ) {

    const regexFile = config.fileSystem.fileAudioTypes;
    const regexSecure = config.security.secureFile;
    const uri = `${context.rootPath}${path}`;

    // Create item's Node document.
    let node = new Node({
        name: name || 'root',
        path: path,
        uri: uri,
        parent: parentId || null,
        isFile: isFile,
    });

    // If item is file.
    if( isFile ) {

        // Test if authorized file.
        if ( !(regexSecure.test(name) && regexFile.test(name)) ) {
            return callback( null, null );
        }

        // Clear name file.
        node.publicName = name.replace(regexFile, '');

        // If test ok, save node.
        return node.save((err) => {
            if (err) {
                return errorHandler.logsError(err);
            }
            context.indexCount++;
            console.log(`Successful indexed ${context.indexCount} files`);
            callback( err, node._id );
        });
    }

    // If item is folder, read it.
    fs.readdir(uri, (err, dir) => {

        if (err) {
            // If error on first iteration, call done callback with error. That stop process, log err and send resp.
            if(context.firstParent){
                context.firstParent = false;
                return done(err);
            }
            // If error during process, just log current error.
            return console.error(`Error on indexing dir file ${path}.`);
        }

        // Once read ok, save Node document.
        node.save((err) => {

            // Call callback, that give current Node id to parent Node.
            if (callback) callback(err, node._id);

            // If err, stop current task and log.
            if (err) {
                return errorHandler.logsError(err);
            }

            // Read item's content.
            async.map(dir, function iterator(item, innerCallback) {

                // Build current item's child path.
                let nodePath = `${path}/${item}`;
                let nodeUri = `${uri}/${item}`;

                // Read item's child.
                fs.lstat(nodeUri, (err, stats) => {

                    if (err) {
                        return console.error(`Error on indexing file ${nodePath}.`);
                    }

                    const isFile =  stats.isFile();

                    // Start item's child indexation.
                    walkAsync(context, nodePath, item, innerCallback, node._id, isFile);
                });

            },
            // Async.map callback. Called with an array of children Node's id.
            // Save on items children's id on item Node.
            function (err, nodesChildrenId) {

                // If err, stop current process.
                // At this state, item's Node is created on DB, but children's Nodes id are not saved in this Node.
                if (err) {
                    // @TODO what's happen if error during children indexation => seems that node children can be saved without parent's node register their Id's... phantom nodes....
                    // @TODO Current node is already saved, some child can have Node created (walkAsync started on all child nodes)
                    // @TODO So, children Node can have been created, but error here stop children ID update on current Node.
                    return console.error(`Error on indexing children files on ${node.path}.`);
                }

                // Filter Nodes id to delete null values.
                // null values correspond on children files that not pass RegEx test.)
                node.children = nodesChildrenId.filter(id => id !== null);

                // Save children's Nodes id on current Node.
                // That end item's indexation process.
                node.save((err) => {
                    if(err) {
                        return errorHandler.logsError(err);
                    }
                    context.indexCount++;
                    console.log(`Successful indexed ${context.indexCount} files`);
                });
            });
        });

        // If read ok on first iteration, call done callback with success.
        if(context.firstParent){
            context.firstParent = false;
            done();
        }
    });
}

