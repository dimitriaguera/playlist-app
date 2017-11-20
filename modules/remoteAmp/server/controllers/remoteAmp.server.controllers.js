/**
 * Created by Dimitri Aguera on 28/08/2017.
 */
'use strict';

const lircNode = require('lirc_node');

const chalk = require('chalk');
const _ = require('lodash');

const path = require('path');
const errorHandler = require(path.resolve('./modules/core/server/services/error.server.services'));

const device = 'NAD_SR6';
lircNode.init();

// To see all of the remotes and commands that LIRC knows about
if (_.isEmpty(lircNode.remotes)){
  console.log(chalk.bgRed('remoteAmp : You have LIRC issue. No remote avaible'));
} else {
  console.log(chalk.blue('remoteAmp : remote avaible in LIRC' + JSON.stringify(lircNode.remotes)));
}

exports.toDo = function (req, res, next) {

  let command = req.params.toDo;


  try {
    lircNode.irsend.send_once(device, req.params.toDo, function() {
      console.log(`Sent ${command} to ${device}`);
    });

    res.json({
      success: true,
      msg: `Sent ${command} to ${device}`
    });

  } catch(err){
    res.status(202);
    errorHandler.errorMessageHandler( err, req, res, next, 'error LIRC' );
  }



};
