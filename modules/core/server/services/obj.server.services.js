/**
 * Created by Marc Foletto on 18/12/2017.
 */
const _ = require('lodash');


/**
 * Remove duplicate value form an array
 * @param arr
 * @returns {[null]}
 */
exports.uniq = function(Arr){
  return [...new Set(Arr)];
};

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

// /**
//  * Push an element on a Array only if
//  * doesn't exist
//  *
//  * @param data
//  * @param array
//  */
// exports.pushUniq = function(data , array){
//
//   if (array.findIndex(elmt => elmt === data) === -1 ){
//     array.push(data);
//   }
//
// };


/**
 * Push an element on a Array only if
 * doesn't exist
 *
 * @param data
 * @param array
 * @param callee
 */
exports.pushUniq = function(data , array, callee){

  const call = callee ? callee : elmt => elmt === data;

    if (array.findIndex(call) === -1 ){
        array.push(data);
    }

};

/**
 * Compare old adn new array and return added or deleted values.
 *
 * @param theOlds
 * @param theNews
 * @returns {{deleted: *, added: *}}
 */
exports.compareArray = function( theOlds, theNews ){

    const deleted = _.difference(theOlds, theNews);
    const added = _.difference(theNews, theOlds);

    return {
      deleted: deleted,
        added: added,
    };
};

/**
 * Merge 2 arrays if needed. If no, return false.
 * @param arr1
 * @param arr2
 * @returns {*}
 */
exports.testMergeArray = function(arr1, arr2) {
    // Concat arr1 and 2, remove clones
    const newArray = _.uniq(arr1.concat(arr2));
    // If more entry, return concat array.
    if( newArray.length !== arr1.length ) {
        return newArray;
    }
    return false;
};

/**
 * Merge => uniq => return
 * @param arr1
 * @param arr2
 * @returns {*}
 */
exports.mergeUniqArray = function(arr1, arr2) {
  return _.uniq(arr1.concat(arr2));
};


/**
 * _.difference([2, 1], [2, 3]);
 * // => [1]
 * @param arr1
 * @param arr2
 */
exports.difference = function(arr1, arr2){
  return _.difference(arr1, arr2);
};