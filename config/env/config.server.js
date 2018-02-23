/**
 * Created by Dimitri Aguera on 27/08/2017.
 */
'use strict';

const confPublic = require('./../conf/config.public');
const confPrivate = require('./../conf/config.private');

const serverConf = Object.assign({}, confPublic, confPrivate);

module.exports = serverConf;
