/**
 * Created by Dimitri on 19/10/2017.
 */
const sanitize = require("sanitize-filename");

// Remove last element of path string.
exports.removeLast = function(path) {
    const regex = new RegExp('[^\/]+\/?$', 'i');
    const result = path.replace(regex, '');

    return result;
};

/**
 * Return an array of path folders.
 * @param str {String}
 * @returns {Array}
 */
exports.splitPath = function( str ){

    const regex = /(\/([^\/]*))/ig;
    let result = [];
    let m;

    while ((m = regex.exec(`/${str}`)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        if( !!m[2] ) result.push(m[2]);
    }

    return result;
};

/**
 * Just clean string.
 * @param str {String}
 */
exports.clean = function( str ) {
    return sanitize(str);
};

/**
 * Remove unsecure caracter on path, and construct secure one.
 * @param path {string}
 * @returns {string}
 */
exports.cleanPath = function( path ) {

    const pArr = this.splitPath( path );

    let clean = '';

    for ( let i = 0; i < pArr.length; i++ ) {
        const brin = sanitize(pArr[i]);
        if( brin === '' ) continue;
        clean += `/${brin}`;
    }
    return clean;
};

// Encode url.
// Encode reserved caracters.
// No encode '[' or ']' according to RFC3986 norm.
exports.urlEncode = function( url ) {
    return encodeURIComponent(url).replace(/%5B/g, '[').replace(/%5D/g, ']');
};