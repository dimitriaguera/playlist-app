/**
 * Created by Dimitri Aguera on 26/12/2017.
 */
const task = require('../controllers/task.server.controllers.js');

module.exports = function(app){

    // Return all task status, ended or not.
    app.route('/api/task').get(task.getAllTask);

    // Return a task.
    app.route('/api/task/id/:memId')
        .get(task.getTask);
        // .delete(task.deleteTask);

    // Return tasks.
    app.route('/api/task/key/:key').get(task.getTask);

    app.param('memId', task.taskById);
    app.param('key', task.taskByKey);
};
