/**
 * Created by Dimitri Aguera on 30/08/2017.
 */

const Task = require('../models/task.server.models');
const path = require('path');
const errorHandler = require(path.resolve('./modules/core/server/services/error.server.services'));

exports.getAllTask = function (req, res, next) {
  Task.find({})
    .lean()
    .exec((err, tasks) => {
      if (err) return errorHandler.errorMessageHandler(err, req, res, next);

      res.json({
        success: true,
        msg: tasks
      });
    });
};

exports.getTask = function (req, res) {
  const task = req.model;

  if (!task) {
    return res.status(404).json({
      success: false,
      msg: 'Task not found'});
  }
  res.json({
    success: true,
    msg: task
  });
};

exports.deleteTask = function (req, res, next) {
  const task = req.model;

  if (!task) {
    return res.status(404).json({
      success: false,
      msg: 'Task not found'});
  }

  task.remove(function (err) {
    if (err) {
      res.status(422);
      return errorHandler.errorMessageHandler(err, req, res, next);
    }
    res.json({
      success: true,
      msg: task
    });
  });
};

exports.taskByName = function (req, res, next, taskName) {
  Task.find({name: taskName}).exec(function (err, task) {
    if (err) {
      return next(err);
    }

    req.model = task;
    next();
  });
};

exports.taskById = function (req, res, next, taskId) {
  Task.findById(taskId).exec(function (err, task) {
    if (err) {
      return next(err);
    }

    req.model = task;
    next();
  });
};
