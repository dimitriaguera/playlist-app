/**
 * Created by Dimitri Aguera on 27/08/2017.
 */
'use strict';

const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');

const app = require('./config/init-app');

const webPackConfig = require('./webpack.dev');
const compiler = webpack(webPackConfig);

const server = app.startApp();

// Tell express to use the webpack-dev-middleware and use the webpack.config.js
// configuration file as a base.
server.expressApp.use(webpackDevMiddleware(compiler, {
  publicPath: "/static/dist/",
}));

/**
 * Fine exit
 */
function exitApp() {
  server.close( () => {
    console.log('Finished all requests');
    console.log('Bonne journée');
    process.exit();
  });
}

process.on('SIGTERM', exitApp);
process.on('SIGINT', exitApp);
process.on('SIGHUP', exitApp);
