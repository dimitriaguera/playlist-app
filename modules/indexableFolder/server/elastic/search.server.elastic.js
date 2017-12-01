/**
 * Created by Dimitri on 16/11/2017.
 */

function searchAll( client ) {
    return ( index, callback ) => {

        let body = {
            size: 3000,
            from: 0,
            query: {
                match_all: {}
            }
        };

        return client.search({index: index, body: body}, callback);
    }
}
exports.searchAll = searchAll;


function search( client ) {
    return ( params, callback ) => {
        return client.search(
            {
                index: params.index,
                type: params.type,
                body: params.body
            },
            callback);
    }
}
exports.search = search;