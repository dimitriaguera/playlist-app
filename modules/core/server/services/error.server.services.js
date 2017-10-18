/**
 * Created by Dimitri on 13/10/2017.
 */

/**
 * Error middlewares
 *
 */

module.exports.logsError = function( err, req, res, next ) {
    console.error(err.stack);
    next(err);
};

module.exports.xhrErrorHandler = function( err, req, res, next ) {

    // By default, if xhr client request and no error handler on modules controller.
    if (req.xhr && !res.headersSent) {
        console.log( 'XHRRRRRRRRR', res.statusCode);
        res
            .status( setDefaultStatus(res.statusCode, 500) )
            .json({
                success: false,
                msg: 'Something failed !'
            });
    }
    else {
        next(err);
    }
};

module.exports.defaultErrorHandler = function( err, req, res, next ) {

    // If Header sent, let Express manage error, stop flux and cut connexion.
    if (res.headersSent) {
        console.log( 'EXPRESS', res.statusCode);
        next(err);
    }

    // Redirect to error page with code 500
    else {
        console.log( 'DEFNOHEAD', res.statusCode);
        res
            .status( setDefaultStatus(res.statusCode, 500) )
            .redirect('../public/dist/views/500');
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
module.exports.errorMessageHandler = function ( err, req, res, next, msg ) {

    // Log error.
    console.error(err.stack);

    // If flux, let express close connexion.
    if (res.headersSent) {
        return next(err);
    }

    // Response.
    return res
        .status( setDefaultStatus(res.statusCode, 500) )
        .json({
            success: false,
            msg: msg || err.message || err.name || err.code
        });
};


//  HELPER
function setDefaultStatus( code, def ){
    return (!code || code === 200) ? def : code;
}