/**
 * Created by Dimitri Aguera on 26/12/2017.
 */
const task = require('../controllers/task.server.controllers.js');

module.exports = function(app){

    // Return all task status, ended or not.
    app.route('/api/task').get(task.getAllTask);

    // Return a task.
    app.route('/api/task/id/:taskId')
        .get(task.getTask)
        .delete(task.deleteTask);

    // Return tasks.
    app.route('/api/task/name/:taskName').get(task.getTask);

    app.param('taskId', task.taskById);
    app.param('taskName', task.taskByName);
};
