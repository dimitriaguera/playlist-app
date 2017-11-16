/**
 * Created by Dimitri on 16/11/2017.
 */
const elasticsearch = require('elasticsearch');
const index = require('./index.server.elastic');
const search = require('./search.server.elastic');

// Instantiate ES client.
const client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'info'
});

exports.indexBulk = index.indexBulk(client);
exports.indexDelete = index.indexDelete(client);

exports.searchAll = search.searchAll(client);