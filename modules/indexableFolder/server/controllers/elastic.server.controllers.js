/**
 * Created by Dimitri Aguera on 30/09/2017.
 */
const fs = require('fs');
const async = require('async');
const path = require('path');
const config = require(path.resolve('./config/env/config.server'));
const errorHandler = require(path.resolve('./modules/core/server/services/error.server.services'));

const Node = require(path.resolve('./modules/indexableFolder/server/models/indexableFolder.server.models'));
const ps = require(path.resolve('./modules/indexableFolder/server/services/path.server.services'));
const es = require(path.resolve('./modules/indexableFolder/server/elastic/elasticsearch'));



exports.index = function (req, res, next) {

    Node.find({}).select('-_id name path meta isFile publicName').lean().exec((err, data) => {
        if(err) return errorHandler.errorMessageHandler(err, req, res, next);

        es.indexDelete('folder', (err, resp) => {
            if(err) return errorHandler.errorMessageHandler(err, req, res, next);

            const param = {
                index:'folder',
                type:'album',
            };

            es.indexBulk(data, param, (err, data) => {
                if(err) return errorHandler.errorMessageHandler(err, req, res, next);

                res.json({
                    success: true,
                    msg: data,
                });
            });
        });
    });
};

exports.update = function(req, res, next) {

};

exports.delete = function(req, res, next) {

};

exports.search = function (req, res, next) {

    const NOT_SECURE_STRING_SEARCH = req.query.search;
    const NOT_SECURE_STRING_OT = req.query.ot;
    const type = ps.clean(req.params.type);
    const terms = ps.clean(NOT_SECURE_STRING_SEARCH);
    const ot = ps.clean(NOT_SECURE_STRING_OT);

    const base_query = {
        query_string: {
            query: `${terms}*`,
            fields: ['name'],
            default_operator: 'AND'
        }
    };

    const params = {
        index: 'folder',
        type: type,
        body: {
            size: 3000,
            from: 0,
            query: base_query,
        }
    };

    if (ot === 'true') {
        params.body.query = {
            bool: {
                must: base_query,
                filter: {
                    term: {isFile: true}
                }
            }
        }
    }

    es.search( params, (err, data) => {
        if(err) return errorHandler.errorMessageHandler(err, req, res, next);

        res.json({
            success: true,
            msg: data,
        });
    });
};

