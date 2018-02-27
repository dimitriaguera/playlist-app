/**
 * Created by Dimitri Aguera on 26/12/2017.
 */
const task = require('../controllers/task.server.controllers');

const path = require('path');
const routeStrategy = require(path.resolve('./modules/users/server/config/route.strategy'));

module.exports = function (app) {
  // Return all task status, ended or not.
  app.route('/api/task')
    .all(routeStrategy.needAuthentication)
    .get(task.getAllTask);

  // Return a task.
  app.route('/api/task/id/:memId')
    .all(routeStrategy.needAuthentication)
    .get(task.getTask);
  // .delete(task.deleteTask);

  // Return tasks.
  app.route('/api/task/key/:key')
    .all(routeStrategy.needAuthentication)
    .get(task.getTask);

  app.param('memId', task.taskById);
  app.param('key', task.taskByKey);
};