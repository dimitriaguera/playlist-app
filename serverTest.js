/**
 * Created by Dimitri Aguera on 29/08/2017.
 */
'use strict';

const chalk = require('chalk');
const dateFormat = require('dateformat');
const config = require('./config/env/config.server');
const express = require('express');

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

/**
 * Check basics needs on config file.
 */
const checkConfig = function () {
  // Check if NODE_ENV is set.
  if (!process.env.NODE_ENV) {
    // If no NODE_ENV, default set to development.
    console.error(chalk.red('WARNING: NODE_ENV is not defined! Set development environment by default'));
    process.env.NODE_ENV = 'development';
  }

  // Check if secret word for JWT generation is different from vanilla.
  if (config.security.jwtSecret === 'SECRET') {
    console.log(chalk.red('Hey bro! You have to change security jwtSecret word on config.js file....'));
  }
};


/**
 * User model.
 *
 */
const TaMereSchema = new Schema({

  name: {
    type: String
  }
});

const TaMere = mongoose.model('TaMere', TaMereSchema);

/**
 * Connect to database
 * @param app
 */
const initDatabase = function (app) {
  const dbUri = `mongodb://${config.db.host}:${config.db.port}/${config.db.database}`;



  const opt = {};
  opt.useMongoClient = true;

  mongoose.Promise = require('bluebird');

  mongoose.connect(dbUri, opt, (err) => {
    if (err) {
      return console.log(chalk.red(`Mongo connexion error on :`, chalk.blue(dbUri), err));
    }

    console.log(chalk.blue(`Mongo connexion OK on :`, chalk.blue(dbUri)));

    const maman = new TaMere({
      name: 'simone'
    });

    maman.save((err) => {
      if (err) {
        return console.log(chalk.red(`Mongo write db error`, err));
      }

      console.log(chalk.blue(`Mongo write db OK`));
    });
  });
};




/**
 * Main initialisation
 * @param app
 */


const app = express();

checkConfig();
initDatabase(app);

config.port = 8085;
app.listen(config.port);

console.log(chalk.green(`SERVER STARTED at ${dateFormat(new Date(), 'isoDateTime')}`));
console.log(chalk.yellow(`MODE ---> ${process.env.NODE_ENV}`));
console.log(chalk.green(`PORT LISTENED :: ${config.port}`));
