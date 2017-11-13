/**
 * Created by Dimitri on 19/10/2017.
 */
const sanitize = require("sanitize-filename");

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