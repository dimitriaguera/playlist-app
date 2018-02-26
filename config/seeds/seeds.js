/**
 * Created by Dimitri Aguera on 20/09/2017.
 */

'use strict';

const path = require('path');
const async = require('async');
const chalk = require('chalk');
const config = require('../env/config.server');
const User = require(path.resolve('./modules/users/server/models/users.server.models.js'));

const models = {
  User
};

const checkIfThereAtLeastOneAdminAndCreateIt = function() {

  User
    .findOne({roles: {$in: ['ADMIN_ROLE']}})
    .then(foundOne => {
        // If no admin create it
      if (!foundOne) {
        return User.create(
          {
            username: config.security.defaultAdminId,
            password: config.security.defaultAdminPassword,
            roles: ['ADMIN_ROLE', 'USER_ROLE']
          }
        )
          .then( () => {
            console.log(chalk.red(`We have created one admin user : ${config.security.defaultAdminId}/${config.security.defaultAdminPassword}`));
            console.log(chalk.bgRed('Please Change It PassWord'));
          })
          .catch( e => {
            console.log(e);
            console.error(chalk.bgRed('Error don\'t manage to create Admin User'));
          })
      } else {
        // Check if admin is the default Pass
        // If it is print a warning message
        return User
          .findOne({username: config.security.defaultAdminId})
          .exec()
          .then( userAdmin => {
            userAdmin.comparePassword('adminpwd')
              .then( test => {
                if (test) console.error(chalk.bgRed('YOU MUST CHANGE THE ADMIN PASS'))
              })
              .catch(e => console.log(e));
          })
          .catch(e => console.log(e));
      }
    })
    .catch(e => console.trace(e))

};

module.exports.populate = function () {

  checkIfThereAtLeastOneAdminAndCreateIt();

  if (!config.seedDB.haveToSeed) return;

  const collections = config.seedDB.collections;

  async.each(collections, (item, cbOut) => {
    const model = models[item.model];
    const documents = item.documents;

    let it = 0;

    async.each(documents, (data, cbInn) => {
      let count = it + 1;

      try {
        model.create(data, err => {
          if (err) {
            console.error(chalk.red(`Error seeds on creating document ${count} of "${item.model}" model.`));
            console.error(chalk.red(`Error seeds: ${err.message}`));
          } else {
            console.log(`Successfully seed your DB on created document ${count} of "${item.model}" model.`);
          }
        });

        it++;
        cbInn();
      } catch (e) {
        console.error(chalk.red(`Error seeds on creating document of "${item.model}" model. Model Doesn't exist.`));
      }

    }, err => {
      if (err) {
        console.log('Error inner seeds')
      }
    });

    cbOut();
  }, err => {
    if (err) {
      return console.log('Error outer seeds');
    }
    return console.log('Outer seeds ok');
  });


};
