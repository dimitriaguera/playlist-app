/**
 * Created by Dimitri Aguera on 28/08/2017.
 */
'use strict';

const _ = require('lodash');

module.exports = function (...authorizedRoles) {
  return function (req, res, next) {
    const userRoles = req.user.roles;
    const ids = [];

    for (let i = 0; i < authorizedRoles.length; i++) ids.push(authorizedRoles[i].id);

    if (!_.intersection(userRoles, ids).length) {
      res.status(403);
      res.send('Not permitted with this role');
      return;
    }
    next();
  }
};
