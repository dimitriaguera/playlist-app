const taskCore = require('../core/task.server.core');
const path = require('path');
const errorHandler = require(path.resolve('./modules/core/server/services/error.server.services'));

exports.create = function( req, res, next ) {
    return function(params, onAccept) {
      try {
        taskCore.register(params, task => {
          // Send 202 accept code to client.
          res.status(202);
          return res.json({
            success: true,
            msg: task
          });
        }, onAccept)
      } catch (e) {
        return errorHandler.errorMessageHandler(e, req, res, next)
      }
    }
};
