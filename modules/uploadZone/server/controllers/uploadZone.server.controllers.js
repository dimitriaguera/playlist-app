/**
 * Created by Marc Foletto on 23/01/2018.
 */

const multer = require('multer');
const fs = require('fs');

const { promisify } = require('util');

const path = require('path');
const ps = require(path.resolve(
  './modules/core/client/services/core.path.services'
));
const { splitTab } = require(path.resolve(
  './modules/core/server/services/obj.server.services'
));

const config = require(path.resolve('./config/env/config.server'));
const rootOK = ps.removeLastSeparator(ps.conformPathToOs(config.musicFolder));

const metaTag = require(path.resolve(
  './modules/editMetaTag/server/services/metaTag.server.services'
));

const { getNodeFromPath, saveInDb } = require(path.resolve(
  './modules/indexableFolder/server/controllers/nodes.server.controllers'
));
const { runElasticUpdates } = require(path.resolve(
  './modules/indexableFolder/server/controllers/elastic.server.controllers'
));

/**
 * Give the destination of the upload
 * @param req
 * @param file
 * @param cb
 */
function dest(req, file, cb) {
  let newDestination = '/' + ps.cleanPath(rootOK + '/' + req.body.targetPath + '/');

  let stat = null;
  try {
    stat = fs.statSync(newDestination);
  } catch (err) {
    try {
      fs.mkdirSync(newDestination);
    } catch (e) {
      throw new Error('Don\'t manage to create directory :"' + newDestination + '"');
    }
  }
  if (stat && !stat.isDirectory()) {
    throw new Error(
      'Directory cannot be created because an inode of a different type exists at "' +
        newDestination +
        '"'
    );
  }
  cb(null, newDestination);
}

/**
 * Give the file name
 * @param req
 * @param file
 * @param cb
 */
function fileName(req, file, cb) {
  cb(null, file.originalname);
}

/**
 * Filter file
 *
 *  ex :
 *  The function should call `cb` with a boolean
 *  to indicate if the file should be accepted
 *
 *  To reject this file pass `false`, like so:
 *  cb(null, false);
 *
 *  To accept the file pass `true`, like so:
 *  cb(null, true);
 *
 *  You can always pass an error if something goes wrong:
 *  cb(new Error('I don\'t have a clue!'));
 *
 * @param req
 * @param file
 * @param cb
 */
function fileFilter(req, file, cb) {
  const regexFile = config.fileSystem.fileAudioTypes;
  const regexSecure = config.security.secureFile;

  if (!(regexSecure.test(file.originalname) && regexFile.test(file.originalname))) {
    return cb(null, false);
  }

  cb(null, true);
}

/**
 * Config of multer.
 */
exports.multerUp = multer({
  // dest: 'uploads/', //  will be override by storage
  limits: {
    fieldNameSize: 100, // Max field name size
    // fieldSize: // Max field value size
    fields: 2, // Max number of non-file fields
    fileSize: 20 * 1000000, // For multipart forms, the max file size (in byte = octet) for each files
    files: 50, // For multipart forms, the max number of file fields
    parts: 52, // For multipart forms, the max number of parts (fields + files)
    headerPairs: 60 // For multipart forms, the max number of header key=>value pairs to parse
  },
  storage: multer.diskStorage({
    destination: dest,
    filename: fileName
  }),
  fileFilter: fileFilter
});

exports.afterUpload = async function(req, res, next) {
  try {
    const metaTagAsync = promisify(metaTag.read);
    const saveInDbAsync = promisify(saveInDb);
    const runElasticUpdatesP = promisify(runElasticUpdates);

    // Clean path
    const targetPath = ps.cleanPath(req.body.targetPath);

    // Get parent id
    const parent = await promisify(getNodeFromPath)(targetPath);
    if (!parent) throw new Error('Cannot find parent id');

    // Make a tab with all file path
    let files = [];
    const nbFiles = req.files.length;
    for (let i = 0; i < nbFiles; i++) {
      files.push(req.files[i].destination + '/' + req.files[i].filename);
    }

    // Read all files in files and save it by bulk
    //  => Meta => DB => ES => Cover
    await (async function bulkTraitement() {
      let tabOnWork = splitTab(files, config.index.sizeChunkNode);
      let nodesToSave, nodes;

      // Load Meta and Forge New Node
      nodesToSave = await Promise.all(
        tabOnWork.map(async function(filePath) {
          const file = path.parse(filePath);

          return {
            name: file.base,
            publicName: file.name,
            path: ps.toPosixPath(path.relative(rootOK, filePath)),
            uri: filePath,
            parent: parent._id,
            isFile: true,
            meta: (await metaTagAsync(filePath)) || metaTag.metaSchema()
          };
        })
      );

      // Save in Db.
      nodes = await saveInDbAsync(nodesToSave);

      // Save in Elastic.
      await runElasticUpdatesP(nodes);

      // @todo check cover

      // If there are files to be treated start again.
      if (files.length) await bulkTraitement();
    })();

    res.json({
      success: true,
      msg: 'success'
    });
  } catch (e) {
    console.log(e);

    res.json({
      success: false,
      msg: e.message
    });
  }
};
