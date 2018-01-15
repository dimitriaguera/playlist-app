/**
 * Created by Dimitri on 16/11/2017.
 */
const elasticsearch = require('elasticsearch');
const index = require('./index.server.elastic');
const search = require('./search.server.elastic');
const chalk = require('chalk');

let client = null;


// Instantiate ES client.
// @t
if (process.env.NODE_ENV === 'production'){
  client = new elasticsearch.Client({
    host: 'localhost:9200',
    requestTimeout: 60000,
    log: [
      {
        type: 'stdio', // default
        level: 'error',
      },
    // {
    //   type: 'file',
    //   level: 'trace',
    //   // config options specific to file type loggers
    //   path: '/var/log/elasticsearch.log'
    // }
  ]
  });
} else {
  client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'info'
  });
}

// @todo test if it's call more than once
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
exports.search = search.search(client);