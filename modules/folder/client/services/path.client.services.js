/**
 * Created by Dimitri on 19/10/2017.
 */
const sanitize = require("sanitize-filename");

// Build path from array.
exports.buildPath = function( array ){
    let path = '';
    for ( let i = 0; i < array.length; i++ ) {
        const brin = sanitize(array[i]);
        if( brin === '' ) continue;
        path += `/${brin}`;
    }

    return path;
};

// Remove route pattern from str String.
exports.removeRoute = function( str, route ) {

    const regex = new RegExp('^(\\' + route + ')', 'i');

    return str.replace(regex, '');
};

// Return Array path from String path.
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

// Clean path String entry.
exports.cleanPath = function( path ) {
    const pArr = this.splitPath( path );
    return this.buildPath( pArr );
};

// Encode url.
// Encode reserved caracters.
// No encode '[' or ']' according to RFC3986 norm.
exports.urlEncode = function( url ) {
    return encodeURIComponent(url).replace(/%5B/g, '[').replace(/%5D/g, ']');
};