/**
 * Created by Dimitri on 13/10/2017.
 */

/**
 * Error middlewares
 *
 */

module.exports.logsError = function(err, req, res, next) {
  console.error(err.stack);
  if (next) {
    next(err);
  }
};

module.exports.xhrErrorHandler = function(err, req, res, next) {
  // By default, if xhr client request and no error handler on modules controller.
  if (req.xhr && !res.headersSent) {
    console.log('XHRRRRRRRRR', res.statusCode);
    res.status(setDefaultStatus(res.statusCode, 500)).json({
      success: false,
      msg: 'Something failed !'
    });
  } else {
    next(err);
  }
};

module.exports.sendErrorBasic = res => {
  res.sendFile(
    process.env.PWD + '/public/dist/500.html',
    {
      maxAge: 0 //no cache
    },
    err => {
      if (err) {
        return res.status(500).send(
          `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Server Error</title>
        </head>
        <body>
          <h1>Server Error</h1>
          <p>The playlistapp service is not available</p>
        </body>
        </html>
        `
        );
      }
    }
  );
};

module.exports.defaultErrorHandler = function(err, req, res, next) {
  // If Header sent, let Express manage error, stop flux and cut connexion.
  if (res.headersSent) {
    console.log('EXPRESS', res.statusCode);
    next(err);
  }

  // Redirect to error page with code 500
  else {
    console.log('DEFNOHEAD', res.statusCode);
    res.status(setDefaultStatus(res.statusCode, 500));
    // With pug engine
    // .render('./public/dist/views/500');
    module.exports.sendErrorBasic(res);
  }
};

/**
 * Error handler for modules controllers.
 * Permit to choise messages to send.
 *
 * @param err
 * @param req
 * @param res
 * @param next
 * @param msg
 */
module.exports.errorMessageHandler = function(err, req, res, next, msg) {
  const e = err || {};

  // Log error.
  console.error(e.stack);

  // If flux, let express close connexion.
  if (res.headersSent) {
    return next(e);
  }

  // Response.
  return res.status(setDefaultStatus(res.statusCode, 500, e)).json({
    success: false,
    msg: msg || e.message || e.name || e.code
  });
};

//  HELPER
function setDefaultStatus(code, def, err) {
  return !code || code === 200 ? def : code;
}
