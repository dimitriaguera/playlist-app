/**
 * Created by Dimitri on 19/10/2017.
 */
const sanitize = require('sanitize-filename');

// Build path with special separator.
exports.buildSeparator = function (array, separator) {
  let path = '';

  if (array[0]) {
    path = sanitize(array[0]);
    for (let i = 1; i < array.length; i++) {
      const brin = sanitize(array[i]);
      if (brin === '') continue;
      path += separator + brin;
    }
  }

  return path;
};

// Build path from array.
exports.buildPath = function (array) {
  return this.buildSeparator(array, '/');
};

// Remove last element of path string.
exports.removeLast = function (path) {
  const regex = new RegExp('[^\/]+\/?$', 'i');
  return path.replace(regex, '');
};

// Remove route pattern from str String.
exports.removeRoute = function (str, route) {
  const regex = new RegExp('^(\\' + route + ')', 'i');
  return str.replace(regex, '');
};

// Change separator.
exports.changeSeparator = function (str, old, now) {
  const regex = new RegExp('(' + old + ')', 'g');
  return str.replace(regex, now);
};

// Return Array path from String path.
exports.splitPath = function (str) {
  const regex = /(\/([^\/]*))/ig;
  let result = [];
  let m;

  while ((m = regex.exec(`/${str}`)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    if (m[2]) result.push(m[2]);
  }

  return result;
};

/**
 * Just clean string.
 * @param str {String}
 */
exports.clean = function (str) {
  return sanitize(str);
};


// Clean path String entry.
exports.cleanPath = function (path) {
  const pArr = this.splitPath(path);
  return this.buildPath(pArr);
};


// Encode url.
// Encode reserved caracters.
// No encode '[' or ']' according to RFC3986 norm.
exports.urlEncode = function (url) {
  return encodeURIComponent(url).replace(/%5B/g, '[').replace(/%5D/g, ']');
};

function changeSlashToAnti (path) {
  return path.replace(/\//g, '\\');
}
function changeAntiToSlash (path) {
  return path.replace(/\\/g, '/');
}

exports.conformPathToOs = function (myPath) {
  let isWin = /^win/.test(process.platform);
  if (isWin) {
    return changeSlashToAnti(myPath);
  } else {
    return changeAntiToSlash(myPath);
  }
};

exports.toPosixPath = function (myPath) {
  return changeAntiToSlash(myPath)
};

exports.removeLastSeparator = function (myPath) {
  if (myPath.slice(-1) === '/' || myPath.slice(-1) === '\\') {
    return myPath.slice(0, -1);
  }
  return myPath;
};

exports.removeFirstSeparator = function (myPath) {
  if (myPath.slice(0, 1) === '/' || myPath.slice(0, 1) === '\\') {
    return myPath.slice(1, myPath.length);
  }
  return myPath;
};