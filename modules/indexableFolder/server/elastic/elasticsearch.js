/**
 * Created by Dimitri on 16/11/2017.
 */
const elasticsearch = require('elasticsearch');
const index = require('./index.server.elastic');
const search = require('./search.server.elastic');
const chalk = require('chalk');

let client = null;
// Instantiate ES client.
if (process.env.NODE_ENV === 'production'){
  client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: ['error', 'trace']
  });
} else {
  client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'info'
  });
}

client.ping({
  // ping usually has a 3000ms timeout
  requestTimeout: 3000
}, function (error) {
  if (error) {
    console.trace(chalk.bgRed('elasticsearch cluster is down!'));
  } else {
    console.log(chalk.green('elasticsearch ok'));
  }
});


exports.indexBulk = index.indexBulk(client);
exports.indexDelete = index.indexDelete(client);

exports.searchAll = search.searchAll(client);
exports.search = search.search(client);