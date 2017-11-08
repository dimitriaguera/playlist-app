/**
 * Created by Dimitri Aguera on 28/08/2017.
 */
'use strict';

const lircNode = require('lirc_node');

const chalk = require('chalk');
const _ = require('lodash');
const device = 'NAD_SR6';

lircNode.init();

// To see all of the remotes and commands that LIRC knows about:
if (_.isEmpty(lircNode.remotes)){
  console.log(chalk.bgRed('remoteAmp : You have LIRC issue. No remote avaible'));
} else {
  console.log(chalk.blue('remoteAmp : remote avaible in LIRC' + lircNode.remotes));
}

exports.toDo = function (req, res) {

  let command = req.params.toDo;

  // Tell the TV to turn on
  lircNode.irsend.send_once(device, req.params.toDo, function() {
    console.log(`Sent ${command} to ${device}`);
  });


  res.json({
    success: true,
    msg: req.params.toDo
  });

};
