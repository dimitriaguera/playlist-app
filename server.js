/**
 * Created by Dimitri Aguera on 27/08/2017.
 */
'use strict';

const app = require('./config/init-app');

const server = app.startApp();


/**
 * Fine exit
 */
function exitApp () {
  server.close(() => {
    console.log('Finished all requests');
    console.log('Bonne journée');
    process.exit();
  });
}

process.on('SIGTERM', exitApp);
process.on('SIGINT', exitApp);
process.on('SIGHUP', exitApp);
