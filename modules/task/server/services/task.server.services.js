const Task = require('../models/task.server.models');
const path = require('path');
const errorHandler = require(path.resolve('./modules/core/server/services/error.server.services'));

exports.create = function( req, res, next ) {

    return function(params, onAccept) {

        const {name, unique = true} = params;

        // Task need a name.
        if (!name || typeof name !== 'string') {
            return errorHandler.errorMessageHandler(new Error(`Task name required, and must be a string.`), req, res, next);
        }

        // Get all task with same name, currently running.
        Task.find({name: name, status: 'pending'}).exec((err, data) => {

            // Check if task already running and if it is set to unique.
            // If exist, return task already running.
            if (checkIsUniqueTask(data)) {
                // Send 202 accept code to client.
                res.status(202);
                return res.json({
                    success: true,
                    msg: data
                });
            }

            // If no running task, create it.
            Task.create({name: name, unique: unique}, (err, task) => {
                if (err) return errorHandler.errorMessageHandler(err, req, res, next);

                // Log start.
                console.log(`Task ${task.name} started at ${task.created}`);

                // After task created, run task process.
                // Call running function with error and done callbacks.
                onAccept(
                    // Task Error handler.
                    body => {
                        task.status = 'rejected';
                        task.ended = Date.now();
                        task.body = body;
                        task.save( err => {
                            if (err) return console.error(err);
                            console.error(`Task ${task.name} started at ${task.created} stopped with error at ${task.ended}`);
                        });
                    },
                    // Task Step handler.
                    body => {
                        task.body = body;
                        task.save( err => {
                            if (err) return console.error(err);
                        });
                    },
                    // Task Done handler.
                    body => {
                        task.status = 'done';
                        task.ended = Date.now();
                        task.body = body;

                        task.save( err => {
                            if (err) return console.error(err);
                            console.log(`Task ${task.name} started at ${task.created} successful done at ${task.ended}`);
                        });
                    }
                );

                // Send 202 accept code to client.
                res.status(202);
                return res.json({
                    success: true,
                    msg: task
                });
            });
        });
    }
};

function checkIsUniqueTask( tasks ){
    for( let i = 0, l = tasks.length; i < l; i++) {
        if( tasks[i].unique ) return true;
    }
    return false;
}