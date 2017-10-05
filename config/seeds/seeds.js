'use strict';
/**
 * Created by Dimitri Aguera on 20/09/2017.
 */
const path = require('path');
const async = require('async');
const chalk = require('chalk');
const mongoose = require('mongoose');
const config = require('../env/config');
const User = require(path.resolve('./modules/users/server/models/users.server.models.js'));

const models = {
    User,
};

module.exports.populate = function() {

    if ( !config.seedDB.haveToSeed ) return;

    const collections = config.seedDB.collections;

    async.each( collections, ( item, cbOut ) => {

        const model = models[item.model];
        const documents = item.documents;

        let it = 0;

        async.each( documents, ( data, cbInn ) => {

            let count = it;
            model.create( data, err => {
                if ( err ) {
                    console.error(chalk.red(`Error seeds on creating document ${count} of ${item.model} model`));
                    console.error(chalk.red(`Error seeds: ${err.message}`));
                } else {
                    console.log(`Successfully seed your DB on created document ${count} of ${item.model} model`);
                }
            });

            it ++;
            cbInn();

        }, err => {
            if ( err ) {
                console.log('Error inner seeds')
            }
        });

        cbOut();

    }, err => {
        if ( err ) {
            return console.log('Error outer seeds');
        }
        return console.log('Outer seeds ok');
    });
};