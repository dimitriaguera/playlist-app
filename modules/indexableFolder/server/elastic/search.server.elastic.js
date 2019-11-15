/**
 * Created by Dimitri on 16/11/2017.
 */

function searchAll(client) {
  return (index, callback) => {
    let body = {
      size: 3000,
      from: 0,
      query: {
        match_all: {}
      }
    };

    return client.search({ index: index, body: body }, callback);
  };
}
exports.searchAll = searchAll;

function search(client) {
  return (params, callback) => {
    return client.search(params, callback);
  };
}
exports.search = search;

function msearch(client) {
  return (params, callback) => {
    return client.msearch(params, callback);
  };
}
exports.msearch = msearch;

function get(client) {
  return (params, callback) => {
    return client.get(params, callback);
  };
}
exports.get = get;

function mget(client) {
  return (params, callback) => {
    return client.mget(params, callback);
  };
}
exports.mget = mget;
