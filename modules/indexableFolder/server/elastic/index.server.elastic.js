/**
 * Created by Dimitri on 16/11/2017.
 */
const chalk = require('chalk');

function buildBulk( index, type, data ) {

    const bulkBody = [];

    data.forEach((item) => {
        bulkBody.push({
            index: {
                _index: index,
                _type: type,
                _id: item._id,
            }
        });
        bulkBody.push(item);
    });

    return {body: bulkBody};
}

/**
 * Bulk elasticsearch index.
 * @param client
 * @returns {function(*=, *)}
 */
function indexBulk( client ) {
    return (data, param, callback) => {

        const index = param.index || 'folder';
        const type = param.type || 'album';

        client.bulk(buildBulk(index, type, data))
            .then( (resp) => {
                console.log(chalk.cyan(`Elasticsearch: Creation ${index} index type ${type} OK. Took ${resp.took} ms.`));
                callback(null, resp);
            })
            .catch((err) => {
                callback(err);
            });

    }
}

exports.indexBulk = indexBulk;

/**
 * Create elasticsearch index.
 * @param client
 * @returns {function(*=, *)}
 */
function indexCreate( client ) {
    return (param, callback) => {

        const index = param.index;
        const body = param.body;

        client.indices.create({index:index, body:body}, (err, data) => {

            callback(err, data);
        });
    }
}

exports.indexCreate = indexCreate;

/**
 * Delete elasticsearch index.
 * @param client
 * @returns {function(*=)}
 */
function indexDelete( client ) {
    return ( index, callback ) => {
        client.indices.exists({index: index}, (err, resp) => {

            if(err) return callback(err);

            if (resp) {
                return client.indices.delete({
                        index: index
                    },
                    callback
                );
            }
            callback(null, `${index} index not found.`);
        });
    }
}
exports.indexDelete = indexDelete;


function putTemplate( client ) {
    return ( params, callback ) => {
        client.indices.putTemplate({
                params: params
            },
            callback
        );
    }
}

exports.putTemplate = putTemplate;