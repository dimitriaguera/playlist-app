/**
 * Created by Dimitri on 16/11/2017.
 */
const chalk = require('chalk');

function buildBulk(data) {
  const bulkBody = [];

  data.forEach(({ action_type, _index, _type, _doc, _id }) => {
    bulkBody.push({
      [action_type]: {
        _index: _index,
        _type: _type,
        _id: _id
      }
    });
    if (_doc) bulkBody.push(_doc);
  });

  return { refresh: true, body: bulkBody };
}

/**
 * Bulk elasticsearch index.
 * @param client
 * @returns {function(*=, *)}
 */
function indexBulk(client) {
  return (data, callback) => {
    client
      .bulk(buildBulk(data))
      .then(resp => {
        console.log(
          chalk.cyan(
            `Elasticsearch: bulk index on ${data.length} documents OK. Took ${resp.took} ms.`
          )
        );
        callback(null, resp);
      })
      .catch(err => {
        callback(err);
      });
  };
}

exports.indexBulk = indexBulk;

/**
 * Create elasticsearch index.
 * @param client
 * @returns {function(*=, *)}
 */
function indexCreate(client) {
  return (param, callback) => {
    const index = param.index;
    const body = param.body;

    client.indices.create({ index: index, body: body }, (err, data) => {
      callback(err, data);
    });
  };
}

exports.indexCreate = indexCreate;

/**
 * Delete elasticsearch index.
 * @param client
 * @returns {function(*=)}
 */
function indexDelete(client) {
  return (index, callback) => {
    client.indices.exists({ index: index }, (err, resp) => {
      if (err) return callback(err);

      if (resp) {
        return client.indices.delete(
          {
            index: index
          },
          callback
        );
      }
      callback(null, `${index} index not found.`);
    });
  };
}
exports.indexDelete = indexDelete;

function putTemplate(client) {
  return (params, callback) => {
    client.indices.putTemplate(
      {
        params: params
      },
      callback
    );
  };
}

exports.putTemplate = putTemplate;
