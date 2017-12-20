/**
 * Created by Marc Foletto on 18/12/2017.
 */


/**
 * Trim obj and key of an obj in deep
 * @param obj
 * @returns {*}
 */
exports.trimObj = function(obj) {
  if ( !Array.isArray(obj) || typeof obj !== 'object' || !obj ) return obj;

  return Object.keys(obj).reduce(function(acc, key) {
    acc[key.trim()] = typeof obj[key] === 'string' ? obj[key].trim() : trimObj(obj[key]);
    return acc;
  }, Array.isArray(obj)? []:{});
};


/**
 * Giving an array split it and return the rest
 */
exports.splitTab = function(files, nbToSplit) {
  let tabOnWork;

  nbToSplit = (files.length > nbToSplit) ? nbToSplit : files.length;

  tabOnWork = files.slice(0, nbToSplit);
  files.splice(0, nbToSplit);
  return tabOnWork;
};