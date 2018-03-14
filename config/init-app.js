/**
 * Created by Dimitri Aguera on 29/08/2017.
 */
'use strict';

const chalk = require('chalk');
const dateFormat = require('dateformat');
const path = require('path');
const config = require('./env/config.server');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const moduleUser = require(path.resolve('modules/users/server/config/passport.strategy'));
const seedDB = require('./seeds/seeds');
const errorHandler = require(path.resolve('modules/core/server/services/error.server.services'));
const { metaLibName } = require(path.resolve('modules/editMetaTag/server/services/metaTag.server.services'));
const http = require('http');
const socketServer = require('socket.io');
const socketsEvents = require(path.resolve('./config/sockets/sockets.conf'));

const fs = require('fs-extra');

/**
 * Check basics needs on config file.
 */
module.exports.checkConfig = function () {
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

  if (metaLibName === 'taglib2') {
    console.log(chalk.blue('Using taglib2 lib for reading and writing meta tag'));
  } else if (metaLibName === 'music-metadata') {
    console.log(chalk.blue('Using music-metadata lib for reading meta tag'));
    console.log(chalk.red('Note : you can\'t write meta tag with music-metadata lib'));
  } else {
    console.log(chalk.red('You can\'t read and write meta tag please install taglib2 or music-metadata'));
  }


  function checkAndCreateFolder(path, name) {
    // Check if exist
    fs.pathExists(path, (err, exists) => {
      if (err) {
        console.log(chalk.bgRed(`Problem when checking the ${name} folder`));
        console.log(chalk.bgRed(path));
        console.log(chalk.bgRed('Exit the app'));
        return process.abort();
      }

      // Don't exist create it
      if (!exists) {

        console.log(chalk.red(`Note : the ${name} folder doesn't exists`));

        fs.ensureDir(path, err => {
          if (err) {
            console.log(chalk.bgRed(`Problem when creating the ${name} folder`));
            console.log(chalk.bgRed(path));
            console.log(chalk.bgRed('Exit the app'));
            return process.abort();
          }
          console.log(chalk.blue(`The ${name} folder was created successfully`));
        });
      }

      console.log(chalk.blue(`${name} path : ${path}`));

    });
  }

  checkAndCreateFolder(config.musicFolder, 'music');
  checkAndCreateFolder(config.picturesFolder, 'pictures');


};

/**
 * Set Application local variables
 */
module.exports.initLocals = function (app) {
  app.locals.title = config.app.title;
  app.locals.description = config.app.description;
  app.locals.keywords = config.app.keywords;
  app.locals.logo = config.app.logo;
  app.locals.favicon = config.app.favicon;
  app.locals.env = config.env;

  // Passing the request url to environment locals
  app.use(function (req, res, next) {
    res.locals.host = req.protocol + '://' + req.hostname;
    res.locals.url = req.protocol + '://' + req.headers.host + req.originalUrl;
    next();
  });

  // Disable the powered-by from header resp.
  app.disable('x-powered-by');
};

/**
 * Init various express middlewares
 */
module.exports.initMiddleware = function (app) {
  // Helmet middleware.
  app.use(helmet());

  // Compression.
  app.use(compression());

  // Body parser
  app.use(bodyParser.urlencoded({
    extended: false
  }));

  app.use(bodyParser.json());
};

/**
 * Init log messages system
 * @param app
 */
module.exports.initLogger = function (app) {
  // Morgan
  app.use(morgan(config.logger));
};

/**
 * Connect to database
 * @param app
 */
module.exports.initDatabase = function (app) {
  const dbUri = `mongodb://${config.db.host}:${config.db.port}/${config.db.database}`;

  let opt = {};

  if (config.db.user && config.db.password) {
    opt.user = config.db.user;
    opt.pass = config.db.password;
  }

  opt.useMongoClient = true;

  mongoose.Promise = require('bluebird');

  mongoose.connect(dbUri, opt)
    .then(
      () => console.log(chalk.green('MONGO OK')),
      err => {
        console.log(err);
        console.log(chalk.bgRed('MONGO : Error when connecting to mongodb'));
        console.log(chalk.bgRed('Exit the app'));
        return process.abort();
      }
    );

};

/**
 * Init Authentication module
 * @param app
 * @param passport
 */
module.exports.initAuth = function (app, passport) {
  moduleUser.init(app, passport);
};

/**
 * Set the pug view engine, called with .server.views.html suffixed files
 * @param app
 */
module.exports.initViewEngine = function (app) {
  // Use pug (jade) view engine.
  app.engine('server.views.html', require('pug').__express);
  app.set('view engine', 'server.views.html');
  app.set('views', path.resolve('./'));

  // Environment dependent middleware
  if (process.env.NODE_ENV === 'development') {
    // Disable views cache
    app.set('view cache', false);
  } else if (process.env.NODE_ENV === 'production') {
    app.locals.cache = 'memory';
  }
};

/**
 * Init routes app
 * @param app
 */
module.exports.initRoutes = function (app) {
  // Virtual path for Static files
  app.use('/static', express.static(path.resolve('./public')));
  app.use('/pictures', express.static(path.resolve(config.picturesFolder)));

  // Modules routes
  require('../modules/users/server/routes/users.server.routes')(app);
  require('../modules/folder/server/routes/folder.server.routes')(app);
  require('../modules/indexableFolder/server/routes/indexableFolder.server.routes')(app);
  require('../modules/music/server/routes/music.server.routes')(app);
  require('../modules/task/server/routes/task.server.routes')(app);
  require('../modules/uploadZone/server/routes/uploadZone.server.routes.js')(app);

  // Let it at the end
  require('../modules/core/server/routes/core.server.routes')(app);
};

/**
 * Init Server Error redirect.
 *
 * @param app
 */
module.exports.initErrorRoutes = function (app) {
  app.use(errorHandler.logsError);
  app.use(errorHandler.xhrErrorHandler);
  app.use(errorHandler.defaultErrorHandler);
};

/**
 * Connect Socket.io to server.
 */
module.exports.socketConnect = function (app) {
  const serve = http.createServer(app);
  const io = socketServer(serve);

  require('../modules/users/server/sockets/users.server.sockets')(socketsEvents, io);
  require('../modules/music/server/sockets/music.server.sockets')(socketsEvents, io);

  return serve;
};

/**
 * Main initialisation
 * @param app
 */
module.exports.startApp = function () {
  const app = express();

  this.checkConfig();

  this.initLocals(app);
  this.initMiddleware(app);
  this.initDatabase(app);
  this.initLogger(app);
  this.initAuth(app, passport);
  this.initViewEngine(app);
  this.initRoutes(app);
  this.initErrorRoutes(app);

  const serve = this.socketConnect(app);

  serve.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log(chalk.bgRed('Address/port already in use, please change port...'));
      serve.close();
      process.exit();
    } else {
      console.log(chalk.bgRed('Error when starting server'));
      serve.close();
      process.exit();
    }
  });

  return serve.listen(config.port, () => {
    console.log(chalk.green(`SERVER STARTED at ${dateFormat(new Date(), 'isoDateTime')}`));
    console.log(chalk.green(`PORT LISTENED :: ${config.port}`));
    console.log(chalk.yellow(`MODE ---> ${process.env.NODE_ENV}`));
    console.log(chalk.green(`SOCKET listening`));
    seedDB.populate();
  });
};
