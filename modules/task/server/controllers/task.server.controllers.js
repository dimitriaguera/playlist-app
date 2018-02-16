/**
 * Created by Dimitri Aguera on 30/08/2017.
 */
const taskCore = require('../core/task.server.core');
const TaskDb = require('../models/task.server.models');
const path = require('path');
const errorHandler = require(path.resolve('./modules/core/server/services/error.server.services'));

exports.getAllTask = function(req, res, next) {

  TaskDb.find({})
        .lean()
        .exec((err, tasks) => {

        if ( err ) return errorHandler.errorMessageHandler( err, req, res, next );

        res.json({
            success: true,
            msg: {
                inMemoryTasks: taskCore.get(),
                inDataBaseTasks: tasks
            }
        });
    });
};

exports.getTask = function(req, res) {
    const task = req.model;

    if ( !task.inMemoryTasks.length && !task.inDataBaseTasks.length ) {
        return res.status(404).json({
        success: false,
        msg: 'Task not found'});
    }

  res.json({
    success: true,
    msg: task
  });
};

// exports.deleteTask = function(req, res, next) {
//
//     const task = req.model;
//
//     if (!task.inMemoryTasks || !task.inDataBaseTasks) {
//         return res.status(404).json({
//             success: false,
//             msg: 'Task not found'});
//     }
//
//   if ( task.inDataBaseTasks ) {
//     task.inDataBaseTasks.remove(function(err){
//       if (err) {
//         res.status(422);
//         return errorHandler.errorMessageHandler( err, req, res, next );
//       }
//       if ( task.inMemoryTasks ) {
//         taskCore.remove(task.inMemoryTasks)
//       }
//       res.json({
//         success: true,
//         msg: task
//       });
//     });
//   }
//
//   else if ( task.inMemoryTasks ) {
//     taskCore.remove(task.inMemoryTasks)
//     res.json({
//       success: true,
//       msg: task
//     });
//   }
// };

exports.taskByKey = function(req, res, next, key) {

  TaskDb.find({key:key}).exec(function(err, task){

        if ( err ) {
            return next( err );
        }

        req.model = {
          inMemoryTasks: taskCore.getByKey(key),
          inDataBaseTasks: task
        };
        next();
    });
};

exports.taskById = function(req, res, next, memId) {

  TaskDb.find({memId: memId}).exec(function(err, task){

        if ( err ) {
            return next( err );
        }

        req.model = {
          inMemoryTasks: [taskCore.getById(memId)] || [],
          inDataBaseTasks: task
        };
        next();
    });
};