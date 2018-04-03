'use strict'
/**
 * Created by Dimitri on 16/11/2017.
 */
const elasticsearch = require('elasticsearch');
const index = require('./index.server.elastic');
const search = require('./search.server.elastic');
const path = require('path');

const { es: esConfig } = require(path.resolve('./config/env/config.server'));


console.log()
// Instantiate ES client.
let client = new elasticsearch.Client(esConfig);

// @todo test if it's call more than once
// const chalk = require('chalk');
// client.ping({
//   // ping usually has a 3000ms timeout
//   requestTimeout: 3000
// }, function (error) {
//   if (error) {
//     console.error(chalk.bgRed('elasticsearch cluster is down!'));
//   } else {
//     console.log(chalk.green('elasticsearch ok'));
//   }
// });


exports.indexBulk = index.indexBulk(client);
exports.indexDelete = index.indexDelete(client);
exports.indexCreate = index.indexCreate(client);
exports.putTemplate = index.putTemplate(client);

exports.searchAll = search.searchAll(client);
exports.msearch = search.msearch(client);
exports.search = search.search(client);
exports.mget = search.mget(client);
exports.get = search.get(client);
