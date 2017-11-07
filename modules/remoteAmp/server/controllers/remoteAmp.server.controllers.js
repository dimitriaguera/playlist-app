/**
 * Created by Dimitri Aguera on 28/08/2017.
 */
'use strict';

const Promise = require('bluebird');
const path = require('path');


exports.toDo = function (req, res) {



  res.json({
    success: true,
    msg: req.params.toDo
  });

};

